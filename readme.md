## This is a Backend Software Engineering coding exercise from Fetch Rewards.
### The guidelines for the exercise are provided below:

<strong>What do I need to submit? </strong>

Please write a web service that accepts HTTP requests and returns responses based on the conditions outlined in the next section. You can use any language and frameworks you choose. 

We must be able to run your web service; provide any documentation necessary to accomplish this as part of the repository you submit. 

Please assume the reviewer has not executed an application in your language/framework before when developing your documentation. 

<strong>What does it need to do? </strong>

Background 

Our users have points in their accounts. 

Users only see a single balance in their accounts. But for reporting purposes we actually track their points per payer/partner.

In our system, each transaction record contains: payer (string), points (integer), timestamp (date). 

For earning points it is easy to assign a payer, we know which actions earned the points. And thus which partner should be paying for the points. When a user spends points, they don't know or care which payer the points come from. But, our accounting team does care how the points are spent. 

There are two rules for determining what points to "spend" first: 
- We want the oldest points to be spent first (oldest based on transaction timestamp, not the order they’re received) 
- We want no payer's points to go negative. 

We expect your web service to Provide routes that: 
- Add transactions for a specific payer and date. 
- Spend points using the rules above and return a list of { "payer": <string>, "points": <integer> } for each call. 
- Return all payer point balances.

Example 
Suppose you call your add transaction route with the following sequence of calls: 
```javascript
{ "payer": "DANNON", "points": 1000, "timestamp": "2020-11-02T14:00:00Z" }  
{ "payer": "UNILEVER", "points": 200, "timestamp": "2020-10-31T11:00:00Z" }  
{ "payer": "DANNON", "points": -200, "timestamp": "2020-10-31T15:00:00Z" }  
{ "payer": "MILLER COORS", "points": 10000, "timestamp": "2020-11-01T14:00:00Z" } 
{ "payer": "DANNON", "points": 300, "timestamp": "2020-10-31T10:00:00Z" }
```

Then you call your spend points route with the following request: 
```javascript
{ "points": 5000 } 
```
The expected response from the spend call would be:
```javascript
[  
    { "payer": "DANNON", "points": -100 }, 
    { "payer": "UNILEVER", "points": -200 }, 
    { "payer": "MILLER COORS", "points": -4,700 }
]
```
A subsequent call to the points balance route, after the spend, should returns the following results: 
```javascript
{ "DANNON": 1000, "UNILEVER" : 0, "MILLER COORS": 5300 , }
```

***

To get started clone this repository and enter the directory.

## Dependencies
Then install dependencies
```bash
$ npm install
```
[Nodejs](https://nodejs.org/en/) - Nodejs is an open source Javascript runtime environment designed for scalable network applications. For this project I was using Node version 17.9.1

[Express](https://expressjs.com/) - Expressjs is a framework for Nodejs. It provides Http utility for creating quick APIs.

Optional:
```bash
$ npm i -g nodemon
```
[Nodemon](https://nodemon.io/) - Nodemon is a utility to automatically restart your Nodejs server without having to do it manually.

Port:
by defualt it uses your environment variable PORT. to set an environment variable for mac: 
```bash
export PORT=<desiredPort>
```
for windows:
```bash 
set PORT=<desiredPort>
```

[Postman](https://www.postman.com/) - Postman is an API platform that you can [download](https://www.postman.com/downloads/) or use in the browser.

To use postman in the browser sign up with an account, then under the 'Get started with Postman' section click import file. Import the file: [fetchRewardsApi.postman_collection.json](fetchRewardsApi.postman_collection.json)


## Using the API with Postman



Once you have imported the fetchRewardsApi.postman_collection.json file you should see something like this:
![API Import](/screenshots/apiImport.png)

You then need to start your node server in your terminal:

if using Nodejs only:
```bash
node index.js
```

if using nodemon:
```bash
nodemon index.js
```
If the server is running correctly you will see a notification in your terminal:
```bash
Listening on port <your port>
```

If you changed your port from 3000 (which is my default), you will have to change all of the addresses in Postman. Mine looks like this: 
```bash
http://localhost:3000/api/transactions
```
Just change the number to match your port.
### Post transactions

To begin we have to first add transactions. The data is stored in the your local memory/your current session so if you refresh you will have to start over.

Navigate to the post api/transactions in the left side of the Postman workspace like below:
![postTransactions](/screenshots/postTransactions.png)

Then click the 'body' tab:
![bodytab](/screenshots/bodytab.png)
Then click the 'raw' circle button and change the dropdown to JSON like below:
![rawbtn](/screenshots/raw.png)
Finally type out the body of your request as a JSON object. The parameters for the object are:
{"payer": "string", "points": integer, "timestamp": "string(date - iso8601 format)"}

Like below:
![json](/screenshots/jsonFormat.png)

Clicking the send button will send a POST http request to your server (running on your defined port). If the request is valid your will get a 200 response with the transaction object like below:

![transactionResponse](/screenshots/response.png)

If the response is not valid (for example missing parameters), you will get a 400 bad request response with the defined parameters like below:

![transactionBadResponse](/screenshots/badresponse.png)

### Get transactions

Once you have posted your transactions you can change the http request from POST to GET as we did above using the dropdown menu. Hitting send will return a 200 code and a list of all the transactions like below:

![getTransactions](/screenshots/getTransactions.png)

this is useful to track the transactions history.

### Get transactions/:id

Using the left workspace panel navigate to the get /api/transactions/dannon

You can change the :id parameter:
```bash
http://localhost:3000/api/transactions/<id>
```
to match a payer name in the transactions list. It will return all of the transactions by that payer's name like below:

![transaction:id](/screenshots/transactionid.png)

### Get balances

using the navigation menu on the left side of the screen to switch to the get /api/balances request (or changing the path to /api/balances):

![getBalances](/screenshots/getBalances.png)

Hitting the send button will result in an object being returned with the total balance of each point payer like below:
![balances](/screenshots/balanceRequest1.png)

### Get payerTransactions

using the navigation menu on the left side of the screen to switch to the get /api/payerTransactions (or changing the path to /api/payerTransactions)

Hitting the send button will result in a list of objects being returned with negative points being subtracted from them (from adding transactions) like below:

![payerTransactions](/screenshots/payerTransactions.png)

### POST spend

using the navigation menu on the left side of the screen to switch to the post /api/spend (or changing the http request to POST using the dropdown and the path to /api/spend)

The spend request needs to have a JSON body like we did above for our post transactions except it only takes:

```json
{"points":integer}
```

Once you click send you should get a 200 response returning a list of objects containing the amount of points spend from each payer like below:

![spend](/screenshots/spend.png)

Checking the balance and payerTransaction get requests will show the points being spent like below:

Balance:
![balance2](/screenshots/balanceRequest2.png)

payerTransactions:
![payerTransactions2](/screenshots/payerTransactions2.png)



