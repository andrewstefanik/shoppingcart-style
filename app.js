const express = require('express');
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
const session = require('express-session');
const braintree = require('braintree');
const app = express();
/////////
////
////

MongoClient.connect('mongodb://webuser:Ducks2014@ds041841.mlab.com:41841/simple_shopping', function(error, database) {
    if(error != null) {
        throw error;
        return;
    }

    db = database;
    console.log('connected to database');
})



const port = 5000;
// Tell express where the public static content is at

app.use(bodyParser.urlencoded({extended: true}));

app.set('view engine', 'ejs');



app.use (express.static ('public'));

/// creating my port

app.listen(5000, function(){
    console.log('Running on port ' + port);
})

// starting my session
app.use(session({
    secret: 'this is my secret code...',
    resave: false,
    saveUninitialized: true
}));

/// routes

app.get('/', function(req, res) {
    res.render('index.ejs');
})

app.get('/login', function(req, res) {
    res.render('login.ejs');
})

app.post('/login', function(req, res) {
    res.render('login.ejs');
})

app.get('/signup', function(req, res) {
    res.render('signup.ejs');
})

app.post('/signup', function(req, res) {
    res.render('signup.ejs');
})

app.get('/profile', function(req, res) {
    res.render('profile.ejs');

    // res.redirect('/error');
})

app.get('/error', function(req, res) {
    res.render('error.ejs');
})



app.get('/product', function(request, response) {
    db.collection('products').find().toArray(function(error, productList) {
        if(error) {
            throw error;
            response.redirect('/error')
        }
        else {
            var item = productList [0];
            console.log('id:', item._id);

            response.render('product-list.ejs', {
                productList: productList
            });
        }
    });

});

app.get('/cart/add/:id', function(request, response) {
    console.log('Item added by id: ' + request.params.id);

    var objectId = request.params.id;

    db.collection('products').findOne(

        {
            name: objectId
        },

        {},
                ///// Call back from query
        function(error, productList) {

            if(error) {
                throw error;
                response.redirect('/error');
            }

            // check if we have a shopping cart in the session
            var cart = request.session.cart

            /// if no cart exists, create a new cart.
            if (!cart) {
                cart = {
                    total: 0,
                    itemList: []
                };

                // save the cart to the session.
                request.session.cart = cart;
            }


            // Grab the item from the result list.
            var item = productList;

            // add to the cart item
            cart.total = cart.total + item.price;

            // Add the product to the cart.
            cart.itemList.push(item);



            console.log('-------------------');
            console.log('product list', productList);
            console.log('cart: ', cart);
            console.log('');
            response.redirect('/cart');
        }
    );

});

//remove individual item from cart

app.get('/cart/remove/:index', function(request, response) {
            // check if we have a shopping cart in the session
            var cart = request.session.cart

            var itemList = request.session.cart.itemList
            // Grab the item from the result list.
            var index = request.params.index


            cart.total = cart.total - itemList[index].price;

            // remove the product to the cart.
            cart.itemList.splice(index, 1);



            response.redirect('/cart');
        });



app.get('/cart', function(request, response) {
    // Grab Shopping cart.
    var cart = request.session.cart;

    //Create the cart if none exists.
    if(!cart) {
        cart = {
            total: 0,
            itemList: []
        }

        var total = cart.total;
        list = cart.itemList;
        for (key in list) {
            item = list [key];
            total = total + item.price
        }
        console.log('total: ', total);
                // save the cart to session.
        request.session.cart = cart;
    }

    // Render the cart page.
    response.render ('cart.ejs', {cart: cart});
});

app.get('/cart/confirm', function(request, response) {
    response.render('confirmation.ejs')

})
//
// app.get('/cart/pay', function(request, response) {
//     response.render('checkout.ejs')
// })
// app.get('/cart/summary', function(request, response) {
//     response.render('summary.ejs')
// })


app.get('/clearCart', function(request, response) {
    request.session.cart = null;
    response.redirect('/cart');
});

// req.params.?
// req.query.?

function sendEmail (email, callback) {
    var item, key, list;
    var emailToList = [];

    // Get the recipients list.
    list = email.to;
    for (key in list) {
        item = list [key];
        emailToList.push ({
            email: item
        });
    }
    // Pull in the http request object used to make
    // an HTTP request from our web server to another web server.
    var request = require ('request');

    // Send a POST request to the sendgrid email service.
    console.log ('- Sending email to: ', emailToList);
    request.post (
        {
            // The api call to post the request to.
            url: 'https://api.sendgrid.com/v3/mail/send',

            // The headers to send with the request.
            headers: {
                'Authorization': 'Bearer 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'
            },

            // The JSON / form data to send with the request.
            json: {
                // The email subject and recipients.
                personalizations: [
                    {
                        to: emailToList,
                        subject: email.subject
                    }
                ],

                // From address.
                from: {
                    email: "no-reply@mydomain.com"
                },

                // The content to send in the body of the email.
                content: [
                    {
                        type: "text/html",
                        value: email.content
                    }
                ]
            },
        },

        // The callback function to run when the email
        // is sent.
        function (error, httpResponse) {
            console.log ('- Email sent');
            if (error) {
                throw error;
            }

            if (callback) {
                callback.apply ();
            }
        }
    );
}

///// EXAMPLE EMAIL ///////
// Send an email.
//     sendEmail (
//         {
//             to: ['stefanik.andrew1@gmail.com'],
//             subject: 'Test Email',
//             content: 'Thanks for opening this email!'
//         },
//         function () {
//             // Render the cart page.
//             response.render ('cart.ejs', {cart: cart});
//         }
//     );
// });


// styling the base template

app.get('/template', function(req, res) {
    res.render('template.ejs');
});

/// Braintree config
var gateway = braintree.connect({
    environment: braintree.Environment.Sandbox,
    merchantId: "27st6d2tpr55wmmh",
    publicKey: "wmxpqm846rg5rk9m",
    privateKey: "bf017347d087f488ea827ff77f147f6e"
});

app.get('/braintree', function(req, res) {
    gateway.clientToken.generate({}, function (err, response) {
        // res.send(response.clientToken);
        res.render('braintree.ejs', {
            data: {
                clientToken: response.clientToken
            }
        });
    });
});

app.get("/client_token", function(req, res) {
        gateway.clientToken.generate({}, function(err, response) {
            res.send(response.clientToken);
    });
});
app.post("/checkout", function(req, res){
    var nonceFromTheClient = req.body.payment_method_nonce;

    console.log ('data: ', req.body);
    console.log ('data: ', nonceFromTheClient);

    // Use payment method nonce here
    gateway.transaction.sale({
        amount: "10.00",
        paymentMethodNonce: nonceFromTheClient,
        options: {
            submitForSettlement: true
        }
    }, function(err, result) {
        console.log ('error: ', err);
        console.log ('result: ', result);
    });
});
