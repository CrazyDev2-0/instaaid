// ######################################## ACCESS ENVIRABLE VARIABLES #############################################################
require('dotenv').config();

const PORT = process.env.PORT || 3006;
const DEBUG = process.env.DEBUG || false;

// ############################################### IMPORT PACKAGES #################################################################
// Express
const express = require('express');
// HTTP Logger
const morgan = require('morgan');
// Express Security plugin
const helmet = require("helmet");
// Cors
const cors = require('cors');
// Response Schema
const ResponseSchema = require("./models/responseSchema");

// Acios
const axios = require('axios');

// Utils
const Utils = require('./helpers/utils');

// Prisma client
const prisma = require('./db_client').getInstance();

// ################################################ EXPRESS SETUP ######################################################
const app = express();
// app.use(helmet());
app.disable('x-powered-by')
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    optionsSuccessStatus: 200
}))

if(process.env.DEBUG) app.use(morgan('dev'));

// ############################################# API ROUTES ###########################################################

// Get all machines
app.get('/machines', async (req, res) => {
    var response = new ResponseSchema();
    try {
        const machines = await prisma.machine.findMany({
            where:{
                OR:[
                    {
                        condomsCount:{
                            gt: 0
                        }
                    },
                    {
                        padsCount:{
                            gt: 0
                        }
                    }
                ]
            },
            select:{
                id: true,
                address: true,
                code: true,
                latitude: true,
                longitude: true,
                condomsCount: true,
                padsCount: true,
            }
        })

        const latitude = parseFloat(req.query.lat);
        const longitude = parseFloat(req.query.lon);
        const maxdist = parseInt(req.query?.distance ?? 10000);

        let filteredMachines = [];

        machines.forEach(machine => {
            var d = Utils.getDistanceFromLatLonInKm(latitude, longitude, machine.latitude, machine.longitude);
            if(d < maxdist) { 
                filteredMachines.push(machine);
            }            
        });
        
        response.setSuccess(true, "Found machines");
        response.setPayload(filteredMachines);
        response.setStatusCode(200);
    } catch (error) {
        console.log(error);
        response.setSuccess(false, "Unexpected error");
        response.setStatusCode(500);
    }
    res.status(response.getStatusCode()).send(response.toJSON());
})

// Order items
app.post('/order', async (req, res) => {
    var response = new ResponseSchema();
    try {
        if(Utils.checkParamsPresence(req.body, ["quantity", "machine_id", "product"])){
            const count = await prisma.order.count({
                where:{
                    ip: req.hostname.toString(),
                    inititateAt:{
                        // Last 1 months
                        gte: new Date(new Date().setMonth(new Date().getMonth() - 1))
                    }
                }
            })
            if(count >= parseInt(process.env.CHECKOUT_PER_MONTH_LIMIT)) throw new Error("Max orders per day reached");
            const machine = await prisma.machine.findFirstOrThrow({
                where:{
                    code: req.body.machine_id
                },
                select:{
                    id: true,
                    padsCount: true,
                    condomsCount: true,
                }
            });
            var quantity = parseInt(req.body.quantity);
            if(!machine) throw new Error("Machine not found");
            if((req.body.product == "condom" && machine.condomsCount < quantity) ||
                (req.body.product == "sanitary_pad" && machine.padsCount < quantity)
            ) throw new Error("Not enough products in machine");

            if(quantity > parseInt(process.env.MAX_ITEMS_PER_ORDER)) throw new Error("Max order quantity reached");

            let payload = {}

            const status = await prisma.$transaction(async()=>{
                const order = await prisma.order.create({
                    data:{
                        ip: req.hostname.toString(),
                        quantity: quantity,
                        machineId: machine.id,
                        price: parseInt(
                            req.body.product == "condom" ? process.env.PRICE_CONDOM :
                            req.body.product == "sanitary_pad" ? process.env.PRICE_PAD : 0
                        )*quantity,
                        product: req.body.product
                    },
                    select:{
                        id: true,
                        price: true,
                    }
                })
    
                const cashfree_order_res = await axios.post("https://sandbox.cashfree.com/pg/orders", {
                        "customer_details": {
                            "customer_id": "anon",
                            "customer_name": "Anonymous",
                            "customer_email": "anon@system.com",
                            "customer_phone": "9999999999"
                        },
                        "order_meta": {
                            // TODO update with a frontend link "return_url": "https://myosic.live/webhooks/payments/verify?order_id={order_id}&order_token={order_token}",
                            "notify_url": "https://instaaidapi.tanmoy.codes/payment-verify",
                        },  
                        "order_id": order.id,
                        "order_amount": order.price,
                        "order_currency": "INR",
                    },  config = {
                    headers:{
                        "Accept": "application/json",
                        "x-client-id": process.env.CASHFREE_PG_ID,
                        "x-client-secret": process.env.CASHFREE_PG_SECRET,
                        "x-api-version": "2022-01-01",
                        "Content-Type": "application/json"
                    }
                })
    
                await prisma.machine.update({
                    where:{
                        id: machine.id
                    },
                    data:{
                        padsCount: req.body.product == "sanitary_pad" ? (machine.padsCount - quantity) : machine.padsCount,
                        condomsCount: req.body.product == "condom" ? (machine.condomsCount - quantity) : machine.condomsCount,
                    }
                })

                payload["link"] = cashfree_order_res.data.payment_link;

                return true;

            })

            if(status){
                response.setSuccess(true, "Order placed");
                response.setStatusCode(200);
                response.setPayload(payload);
            }else{
                response.setSuccess(false, "Failed to place order");
                response.setStatusCode(200);
            }


        }else{
            response.setSuccess(false, "Missing parameters");
            response.setStatusCode(400);
        }

    } catch (error) {
        console.log(error);
        response.setSuccess(false, error.message);
        response.setStatusCode(500);
    }
    res.status(response.getStatusCode()).send(response.toJSON());
})

// Verify payment
app.post('/payment-verify', async (req, res) => {
    const order_id = req.body.data.order.order_id;
    await prisma.order.findFirstOrThrow({
        where:{
            id: order_id,
            orderStatus: "pending",
            OR:[
                {
                    paymentStatus: "failed"
                },
                {
                    paymentStatus: "pending"
                }
            ]
        }
    })
    const cf_response = await axios.get(`https://sandbox.cashfree.com/pg/orders/${order_id}`, {
        headers:{
            "Accept": "application/json",
            "x-client-id": process.env.CASHFREE_PG_ID,
            "x-client-secret": process.env.CASHFREE_PG_SECRET,
            "x-api-version": "2022-01-01",
        }
    })

    if(cf_response.data.order_status == "PAID"){
        await prisma.order.update({
            where:{
                id: order_id
            },
            data:{
                paymentStatus: "paid"
            }
        })
    }

    res.status(200).send("OK");
})

// Fetch order
app.get('/get-order', async(req, res)=>{
    try {
        const order_details = await prisma.order.findFirstOrThrow({
            where:{
                orderStatus: "pending",
                paymentStatus: "paid",
                machine:{
                    code: req.query.code
                }
            },
            select:{
                id: true,
                quantity: true,
                product: true,
            },
            orderBy:{
                inititateAt : "asc"
            }
        })

        let payload = (order_details.product == "condom" ? 1 : 2).toString() + order_details.id+"-"+order_details.quantity;
        
        await prisma.order.updateMany({
            where:{
                id: order_details.id
            },
            data:{
                orderStatus: "dispensed"
            }
        })

        // payload = Utils.encryptAES(payload);



        // const responseText = Utils.encryption(`${req.query.code}:${order.quantity}`);

        res.status(200).send(payload);
    } catch (error) {
        res.status(200).send("");
    }
})

// ########################################### API at root level to understand ONLINE ##################################
app.get('/', async (req, res, next) => {
    let response = new ResponseSchema();
    response.setSuccess(true, "🔥 System is up and online 🔥");
    response.setStatusCode(200);
    res.status(response.getStatusCode()).json(response.toJSON());
});

// ################################# ROUTE NOT MATCHED ####### 404 #### 505 ##### ERROR HANDLE ########################################

// Handle errors if no route matches
app.use((req, res, next) => {
    let response = new ResponseSchema();
    response.setSuccess(false, "404 not found");
    response.setStatusCode(404);
    next(response);
});

// Handle errors if any error come without handling errors
app.use((err, req, res, next) => {
    let response;
    if(!(err instanceof ResponseSchema)){
        response = new ResponseSchema();
        response.setSuccess(false, err.message || "Unexpected error");
        response.setStatusCode(err.code || 500);
    }else{
        response = err;
    }
    res.status(response.getStatusCode()).json(response.toJSON());
});

// ################################################ START LISTENING ON PORT ############################################################
app.listen(PORT, () => console.log(`🚀 @ http://localhost:${PORT}`));
