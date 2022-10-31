const https = require('https');

function postRequest(req) {
  const authorization = req.headers.authorization;
  console.log("request bodyP: ", req.body);

  const encodedParams = {
    ...req.body,
    "options.get_client_auth_token": true,
  };
  req.body.merchant_id = req.headers["x-merchantid"];
  const body = req.body;
  const options = {
    method: "POST",
    url: "https://sandbox.juspay.in/orders",
    headers: {
      accept: "application/json",
      "content-type": "application/x-www-form-urlencoded",
      authorization: authorization,
      "x-merchant-id": req.headers["x-merchantid"],
      version: "2022-10-11",
    },
    data: encodedParams,
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      let rawData = '';

      res.on('data', chunk => {
        rawData += chunk;
      });

      res.on('end', () => {
        try {
          resolve(JSON.parse(rawData));
        } catch (err) {
          reject(new Error(err));
        }
      });
    });

    req.on('error', err => {
      reject(new Error(err));
    });

    // 👇️ write the body to the Request object
    req.write(JSON.stringify(body));
    req.end();
  });
}

exports.handler = async event => {
  try {

    let r = await postRequest(event);
    const sdk_payload = {
      requestId: uuid(),
      service: "com.juspay.gemi",
      payload: {
        clientId: event.payment_page_client_id,
        merchantId: r.merchant_id,
        clientAuthToken: r.juspay.client_auth_token,
        clientAuthTokenExpiry: r.juspay.client_auth_token_expiry,
        environment: "sandbox",
        action: event.action,
        customerId: r.customer_id,
        currency: r.currency,
        customerPhone: r.customer_phone,
        customerEmail: r.customer_email,
        orderId: r.order_id,
        address: event.address,
        timestamp: event.timestamp,
        firstName : event.first_name,
        lastName : event.last_name,
        returnUrl : event.return_url,
        amount: r.amount,
        cardNumber: event.cardNumber,
        orderDetails: JSON.stringify(event),
      },
    };
    result = { ...r, sdk_payload };
    console.log('result is: 👉️', result);

    // 👇️️ response structure assume you use proxy integration with API gateway
    return {
      statusCode: 200,
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.log('Error is: 👉️', error);
    return {
      statusCode: 400,
      body: error.message,
    };
  }
};