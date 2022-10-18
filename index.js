const express = require('express');
const app = express();
app.use(express.json()); //use middleware in the request processing pipeline

const port = process.env.PORT || 3000;; //define the port you would like to listen on. by defualt it uses your environment variable PORT. to set an environment variable you can use export PORT=XXXX; windows would be set PORT=XXXX.

const transactions = []


//track the total points
let totalPoints = 0;
//create an object to track the total of each payer's points
let payerTotalPoints = {};
//list keeping track of oldest remaining point value totals (from negative transactions)
let payerTotalTransaction = []

// can navigate to / to check if the server is running
app.get('/', (req, res) => {
    res.send(`Server is running on port ${port}`);
})

//view all current transactions
app.get('/api/transactions', (req, res)=>{
    
    res.send(transactions);
})
//view all balances
app.get('/api/balances', (req,res)=>{
    res.send(payerTotalPoints)
})
//view all payerTotalTransactions
app.get('/api/payerTransactions', (req,res)=>{
    res.send(payerTotalTransaction)
})
//view transactions by payer name
app.get('/api/transactions/:id', (req, res)=>{
    const transaction = transactions.filter(transaction => transaction.payer === req.params.id.toUpperCase());
    if(!transaction) res.status(404).send('The transaction with the given payer was not found.')
    res.send(transaction)
})

//post a new transaction
app.post('/api/transactions', (req,res)=>{
    //if any of the parameters are not included return an error code
    if(!req.body.payer || !req.body.points || !req.body.timestamp){
        res.status(400).send('A payer: <string>, points: <number>, and timestamp: <ISO8601> is required');
    }
    //deconstruct the request body into local variables
    let points = req.body.points;
    let payer = req.body.payer;
    let timestamp = req.body.timestamp;
    //validate that points cannot go negative
    if(!payerTotalPoints[payer] && points < 0 || ((payerTotalPoints[payer] + points) < 0)){
        return res.status(422).send('A payer balance cannot go negative')
    }
    //check to see if the transaction is new
    else if(!payerTotalPoints[payer]){
        //if it is new make a new transaction object that holds the total points for that payer
        payerTotalPoints[payer] = points;

    } else {
        //if that object does exist add the points to it
        payerTotalPoints[payer] += points;
    }
    //create a transaction object
    const transaction = {
        payer: payer, 
        points: points,
        timestamp: timestamp
    };
    //if points are positive push the total transactions object into the list
    if(points > 0){
        payerTotalTransaction.push(transaction)
    }
    //if the points are negative search and subtract from the total transactions object if able.
    else if(points < 0){
        //iterate over payerTotalTransaction, checking if the payer name matches. if there is a match, and the points can be subtracted, subtract them
        let tempPoints = Math.abs(req.body.points);
        //while temp points is greater than 0 iterate over the total transaction object in order to find the first object containing a payer name match that can be subtracted from.
        let indexCounter = payerTotalTransaction.length -1;
        while (tempPoints > 0) {
            //store and keep track of the index
            
            
            //check to make sure the payer name matches the new transaction and check to see if the points are negative
            if(payerTotalTransaction[indexCounter].payer === payer && (payerTotalTransaction[indexCounter].points - tempPoints) >= 0 ){ 
                //if there is a match subtract those points from the payerTotalPoints object.
                payerTotalTransaction[indexCounter].points -= tempPoints
                //remove the points from the tempPoints variable ending the while loop
                tempPoints = 0;
            //otherwise push the new transaction
            }
            indexCounter --
        } 
    }

    //add the points to the totalpoints
    totalPoints += points
    //push the transaction object into the transactions list
    transactions.push(transaction);
    //return the transaction that was sent
    res.send(transaction)
    
})

//spend points request
app.post('/api/spend', (req,res)=>{
    //check to see if there are enough points available
    if(totalPoints < req.body.points){
        return res.status(422).send('The total balance of points must be greater than the points being spent. '+ ' Total points available: '+ totalPoints + " Requested spend: "+ req.body.points)
    }
    //if the points being requested to spend are negative or 0
    if(req.body.points <= 0){
        return res.status(422).send('The spent points must be a number greater than 0')
    }
    //index to use as a counter
    let index = 0;
    //the points to be spent deconstructed from the request body
    let spendPoints = req.body.points;
    //a list holding the spend transaction objects to be returned
    let spendTransaction = []
    //sorting the payerTotalTransaction objects by date
    let sortTransactions = payerTotalTransaction.sort((a,b) => new Date(a.timestamp) - new Date(b.timestamp))
    //a list to store the objects that will need to be removed from the payerTotalTransactions
    let transactionRemoveObject = []
    //while the points to be spent are greater than 0
    while(spendPoints > 0){
        //if the sorted transactions points are less than or equal to the points to be spent, and greater than 0
        if(sortTransactions[index].points <= spendPoints && sortTransactions[index].points > 0){
            //push an object into the list to be returned
            spendTransaction.push({"payer": sortTransactions[index].payer, "points" : sortTransactions[index].points * -1 })
            //push the sorted object at the current index into a new list to be removed later so duplication cannot happen.
            transactionRemoveObject.push(sortTransactions[index])
            //subtract from the total points object
            payerTotalPoints[sortTransactions[index].payer] -= sortTransactions[index].points
            //subtract payerTotal from the spendPoints
            spendPoints -= sortTransactions[index].points
        //if the sorted transactions points are greater than the points to be spent
        }else if( sortTransactions[index].points > spendPoints && sortTransactions[index].points > 0){
            //add the payer and points being spent to return later
            spendTransaction.push({"payer": sortTransactions[index].payer, "points" : (spendPoints * -1) })
            //find and update the payerTotalPoints to reflect the points being spent from the total balance
            payerTotalPoints[sortTransactions[index].payer] -= spendPoints
            //find the index and subtract the points from the payerTotalTransaction list
            let subtractPointsIndex = payerTotalTransaction.findIndex(object => object.timestamp === sortTransactions[index].timestamp)
            //subtract that index from the payerTotalTransaction list
            payerTotalTransaction[subtractPointsIndex].points -= spendPoints
            //make sure the points to spend is 0
            spendPoints = 0
        }
        //move to the next sortTransactions object
        index ++
    }
    //update the payerTotalTransactions to reflect the transaction histort that took place:
    let transactionCounter = transactionRemoveObject.length -1;
    while (transactionCounter >= 0){
        //iterate over the payerTotalTransaction object
        for(let i = 0; i < payerTotalTransaction.length; i++){
            //if there is a match for the timestamps, remove it from the list.
            if(payerTotalTransaction[i].payer === transactionRemoveObject[transactionCounter].payer && payerTotalTransaction[i].timestamp === transactionRemoveObject[transactionCounter].timestamp ){
                payerTotalTransaction.splice(i,1)
            }
        }
        transactionCounter --
    }
    //send the spent points list back
    res.send(spendTransaction)
})

//log to the terminal what port you are using
app.listen(port, ()=> console.log(`Listening on port ${port}`))

