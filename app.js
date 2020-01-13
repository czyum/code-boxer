//@Complete e-Ration scheduler app;
//Author: Chethan N , 5th sem , Information Science and Engineering , BMSIT&M 
//date:05/12/2019
//For mini-project 2019-20

//Importing required packages
const express=require("express");
const bodyParser=require("body-parser");
const ejs=require("ejs");
const sql=require("mysql");
const url=require("url");
const session=require("express-session");
const
{
    PORT=5000,
    SESS_LIFE=60*60*60*10,
    NODE_ENV='development',
    SESS_NAME='session_id',
    SESS_SEC='czyum rocks!'
}=process.env

const PROD=NODE_ENV==='production'

//Setting up an express server and session params
const app =express();
app.use(bodyParser.urlencoded({extended:true}));
app.use('/public', express.static('public'));
app.use(session({
    name:SESS_NAME,
    saveUninitialized:false,
    secret:SESS_SEC,
    resave:false,
    cookie:{
        maxAge:SESS_LIFE,
        sameSite:true,
        secure:PROD,
        resave:false
        
     }

}))
app.set('view engine','ejs');

//Required routing authentication

const redirectAdmin=(req,res,next)=>{
    if(!req.session.adminId){
        res.redirect("/admin")
    }
    else{
        next()
    }
}

const redirectConsumer=(req,res,next)=>{
    if(req.session.adminId){
        res.redirect("/admin/consumer")
    }
    else{
        next()
    }}

const redirectHome=(req,res,next)=>{
    if(req.session.adminId &&  req.url === '/'){
        res.redirect("/admin")
    }
    else{
        next()
    }
}

//Connection to the database

const connection = sql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database:'ration',
  multipleStatements:true
 });
connection.connect((err) => {
    if (err) throw err;
    console.log('Connected!');
  });
var error=""

//Home page requests

app.get("/",redirectHome, function(req,res){
    const {adminId}=req.session
    console.log(req.session)

    res.render("home.ejs",{error:error});
  
});

app.post("/",redirectHome,function(req,res){
    card_no=req.body.ration_num;
    date=req.body.date;
    time=req.body.time;
    let myquery=`SELECT card_no FROM consumer WHERE card_no=${card_no}`
    connection.query(myquery,(err,rows)=>{
      if (err){
          error="Invalid Consumer Number!"
          res.redirect("/")
      }
      else{
          console.log(rows)
          if(rows.length===0){
            error="Invalid Consumer Number!"
            res.redirect("/")
          }
else{
          error=""
        let query1=`INSERT INTO schedule VALUES('${card_no}','${date}','${time}','pending')`;
        connection.query(query1,(err,rows)=>{
            if(err){
                error="Already booked!"
                res.redirect("/")
            }
            else{
                let query2=`SELECT name ,address,dist_no FROM consumer WHERE card_no=${card_no}`;
                connection.query(query2,(err,rows)=>{
                    if(err)throw err;
                    else{
                        name=rows[0].name;
                        address=rows[0].address;
                        dist_no=rows[0].dist_no;
                        res.render("success.ejs",{dist_no:dist_no,date:date,card_no:card_no,time:time,name:name,address:address});
                    }
                  
                });
            }
           
            });}
      }
    })
    

 
    

    
});
var msg=""
var count=0

//Distributor page requests

app.get("/admin",redirectConsumer, function(req,res){
    
         
    res.render("login.ejs",{msg:msg});
});
 consumer=0;
 admin=0;

app.post("/admin",redirectConsumer,function(req,res){
    admin=req.body.admin_num;
    pass=req.body.admin_pass;
    let query1=`SELECT * FROM distributor WHERE dist_no=${admin}`;
    connection.query(query1,(err,rows)=>{
        if(err) {
            count++;
            msg="Invalid credentials!"
            res.redirect("/admin");
           

        }
        else{
           
            if(rows.length!=0 && pass===rows[0].password){
                
               
                req.session.adminId=rows[0].dist_no
                
                res.redirect(url.format({
                    pathname:"/admin/consumer",
                    query:{"admin":admin}
}));

            }
            else{
            
             msg="Invalid credentials!"
                res.redirect("/admin")
               
            }
        }
    });
    
});

// Distributor -consumer authentication requests

app.get("/admin/consumer",redirectAdmin, function(req,res){

    res.render("consumer.ejs");
    
  
});
var rice=0;
var wheat=0;
var ragi=0;
var sugar=0;
var oil=0;
var rice_price=0;
var wheat_price=0;
var ragi_price=0;
var sugar_price=0;
var oil_price=0;
var total=0;

app.post("/admin/consumer",redirectAdmin,function(req,res){
    consumer=req.body.consumer_num;
    admin=req.session.adminId
    query1=`SELECT dist_no,status FROM consumer,schedule WHERE schedule.card_no='${consumer}' and consumer.card_no=schedule.card_no `;
    
    connection.query(query1,(err,rows)=>{
        if(err) throw res.send("Error occured");
        else{
            if(rows.length>0 ){
                console.log(rows)
                if(rows[0].dist_no===admin&&rows[0].status!='issued'){
            dist=rows[0].dist_no;
            if(admin===dist){
            res.redirect(url.format(
                {
                    pathname:"/admin/consumer/details",
                    query:{
                        "admin":admin,
                        "consumer":consumer

                    }
                }
            ));
        }
        else{
            res.redirect(url.format({
                pathname:"/admin/consumer",
                query:{"admin":admin}
}));   
        
         } }
        else{
            if(admin!=rows[0].dist_no){
                message="The consumer has not booked any slot with this distributor"

                res.render("error.ejs",{message:message});
        }
        else{   
        query1=`SELECT * from purchase WHERE card_no=${consumer}`
        connection.query(query1,(err,rows)=>{
            if(err) throw err
            else{
                query2=`SELECT * from item`;
                connection.query(query2,(err,rows2)=>{
                    if(err) throw res.send("Data not received");
                    else{
                        rice=rows[0].rice;
                        wheat=rows[0].wheat;
                        ragi=rows[0].ragi;
                        sugar=rows[0].sugar;
                        oil=rows[0].oil;
                        rice_price=rows2[0].price*rice;
                        wheat_price=rows2[1].price*wheat;
                        ragi_price=rows2[2].price*ragi;
                        sugar_price=rows2[3].price*sugar;
                        oil_price=rows2[4].price*oil;
                        total=rice_price+wheat_price+ragi_price+sugar_price+oil_price;
                        let issue="Already Issued!"
                        res.render("issued.ejs",{issue:issue,rice:rice,wheat:wheat,ragi:ragi,sugar:sugar,oil:oil,rice_price:rice_price,wheat_price:wheat_price,ragi_price:ragi_price,sugar_price:sugar_price,oil_price:oil_price,total:total});
                       }
                });
            }
        });
        
         
        }}}
    else{
        query8=`SELECT card_no FROM consumer where card_no='${consumer}'`
        connection.query(query8,(err,rows)=>{
            if(err)throw err
            else{
                if(rows.length===0){
                    message="The Consumer doesn't exist"

                    res.render("error.ejs",{message:message});
                }
                else{
                    message="The consumer has not booked any slot with this distributor"

                res.render("error.ejs",{message:message});
                }
            }
        })
        
        
    }

        }
    });
});

app.post("/admin/consumer/issued",redirectAdmin,(req,res)=>{
    res.redirect("/admin");
})

//consumer details page requests

app.get("/admin/consumer/details",redirectAdmin,function(req,res){
    consumer=req.query.consumer;
    query1=`SELECT name,address,s.card_no,date,time,status FROM consumer c,schedule s WHERE s.card_no=${consumer} and s.card_no=c.card_no`;
    connection.query(query1,(err,rows)=>{
        if(err) {
            message="The person has not scheduled or the ration card id is wrong !"
            res.render("error.ejs",{message:message})
        }
        else{
           
            if(rows.length>0){
            card_no=rows[0].card_no;
            name=rows[0].name;
            address=rows[0].address;
            date=rows[0].date;
            time=rows[0].time;
            status=rows[0].status;
            res.render("cons_details.ejs",{card_no:card_no,name:name,address:address,date:date,time:time,status:status});
        }
    else{
        res.render("error.ejs")
    }}
    });

   
});

app.post("/admin/consumer/details",redirectAdmin,function(req,res){
       res.redirect(url.format({
        pathname:"/admin/consumer/details/inventory",
        query:{
             "admin":admin,
            "consumer":consumer
        }
    }));
});

//Consumer inventory page requests

app.get("/admin/consumer/details/inventory",redirectAdmin,function(req,res){
    res.render("inventory.ejs");
});


app.post("/admin/consumer/details/inventory",redirectAdmin,function(req,res){
    rice=req.body.rice;
    wheat=req.body.wheat;
    ragi=req.body.ragi;
    sugar=req.body.sugar;
    oil=req.body.oil;
    res.redirect(url.format({
        pathname:"/admin/consumer/details/inventory/finish",
        query:{
            "admin":admin,
            "consumer":consumer,
            "ri":rice,
            "wh":wheat,
            "ra":ragi,
            "su":sugar,
            "ol":oil

        }
    }));
});

//Distributor final page requests

app.get("/admin/consumer/details/inventory/finish",redirectAdmin,function(req,res){
    query1=`SELECT * from item`;
    connection.query(query1,(err,rows)=>{
        if(err) throw res.send("Data not received");
        else{
            rice=req.query.ri;
            wheat=req.query.wh;
            ragi=req.query.ra;
            sugar=req.query.su;
            oil=req.query.ol;
            rice_price=rows[0].price*rice;
            wheat_price=rows[1].price*wheat;
            ragi_price=rows[2].price*ragi;
            sugar_price=rows[3].price*sugar;
            oil_price=rows[4].price*oil;
            total=rice_price+wheat_price+ragi_price+sugar_price+oil_price;
            querys=`SELECT * FROM stock WHERE rice>${rice} and wheat>${wheat} and ragi>${ragi} and sugar>${sugar} and oil>${oil} and dist_no='${admin}'`;
            connection.query(querys,(err,rows)=>{
                if(err)
                   res.send("Error occurred!!")
                   else if(rows.length>0){
                    let issue=""
                    res.render("finish.ejs",{issue:issue,rice:rice,wheat:wheat,ragi:ragi,sugar:sugar,oil:oil,rice_price:rice_price,wheat_price:wheat_price,ragi_price:ragi_price,sugar_price:sugar_price,oil_price:oil_price,total:total});
                   }
                   else{
                       console.log(rows)
                      message="There is not enough stock"
                      res.render("error.ejs",{message:message})
                   }

            })
           
           }
    });
  
});

app.post("/admin/consumer/details/inventory/finish",redirectAdmin,function(req,res){
            query2=`INSERT INTO purchase VALUES('${consumer}',${rice},${wheat},${ragi},${sugar},${oil});`;
            // query3=`UPDATE schedule SET status='issued' WHERE card_no='${consumer}';`;
            query4=`UPDATE stock SET rice=rice-${rice} , wheat=wheat-${wheat} ,ragi=ragi-${ragi},sugar=sugar-${sugar},oil=oil-${oil}  WHERE dist_no=${admin} ;`;
            

            exec=query2+query4;
    connection.query(exec,(err,rows)=>{
         if(err)throw err;
         else{

            res.redirect("/admin/consumer?admin="+admin);
         }
    });
   
});

//Contact page requests

app.get("/contact",function(req,res){
    res.render("contact.ejs");
});


//Logout requests

app.get("/admin/logout",redirectAdmin,(req,res)=>{
    req.session.destroy((err)=>{
        if(err){
            res.redirect("/admin/consumer")
        }
        res.clearCookie(SESS_NAME)
        res.redirect("/admin")
        msg=""
    })
})

//Distributor search page requests

app.get("/admin/search",redirectAdmin,(req,res)=>{
    query1=`SELECT c.card_no ,c.name,status from consumer c,distributor d,schedule s WHERE d.dist_no=${admin} and c.dist_no=d.dist_no and c.card_no=s.card_no`;
    connection.query(query1,(err,rows)=>{
        if(err)throw err
        else{
            list=rows;
            
            res.render("search.ejs",{list:list});
        }
    })
    
})

//Distributor add page requests

app.get("/admin/add",redirectAdmin,(req,res)=>{
    res.render("add.ejs");
})

app.post("/admin/add",redirectAdmin,(req,res)=>{
    name=req.body.name;
    card_no=req.body.card_no;
    address=req.body.address;
    dist_no=admin;
    query1=`INSERT INTO consumer VALUES('${card_no}','${name}','${address}','${dist_no}')`
    connection.query(query1,(err,rows)=>{
        if(err){
            message="The customer already exists!"
            res.render("error.ejs",{message:message});

        }
        else{
            res.render("add_success.ejs",{dist_no:dist_no,card_no:card_no,name:name,address:address});

        }
    })
})

//Distributor pending page requests

app.get("/admin/search/pending",redirectAdmin,(req,res)=>{
    query1=`call display_pending('${admin}')` ;
    connection.query(query1,(err,rows)=>{
        if(err)throw err
        else{
            console.log(rows[0])
            list=rows[0];
            
            res.render("search.ejs",{list:list});
        }
    })


})

//About page requests

app.get("/about",(req,res)=>{
    res.render("about.ejs")
})

//Starting the server

app.listen(PORT,function(){
    console.log("Server started at port "+PORT);
    
});

