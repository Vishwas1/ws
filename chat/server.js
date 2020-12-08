const http = require('http')
const express = require('express')
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const ws = require('./ws')
const { clientStore } = require('./config')
const cors = require('cors');
const jwt = require('jsonwebtoken');
const hsdk = require('lds-sdk');

const jwtExpiryInMilli = 240000
const jwtSecret = process.env.JWT_SECRET || 'secretKey'


const options = { nodeUrl: "http://localhost:5000", didScheme: "did:hs" }
const hsSdkVC = hsdk.credential(options)

const port = 4000
const app = express()
const server = http.createServer(app) //Creating HTTP server using express
ws(server)

const TIME = () => new Date();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
app.use(cookieParser());
app.use(express.static('public'))
app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + 'index.html'));
});

function getFormatedMessage(op, data) {
    return JSON.stringify({
        op,
        data
    })
}
app.post('/auth', async(req, res) => {
    try {
        const { challenge, vp } = req.body;
        const vpObj = JSON.parse(vp);
        const subject = vpObj['verifiableCredential'][0]['credentialSubject'];
        if (!(await verifyVP(vpObj, challenge))) res.send("Un-Authorized!");
        jwt.sign(
            subject,
            jwtSecret, { expiresIn: jwtExpiryInMilli },
            (err, token) => {
                if (err) throw new Error(err)
                const client = clientStore.getClient(challenge)
                client.connection.sendUTF(getFormatedMessage('end', { message: 'User is validated. Go to home page.', userdata: token }))
                clientStore.deleteClient(client.clientId);
                res.status(200).send({ status: 200, message: "Success", error: null });
            })
    } catch (e) {
        console.log(e)
        res.send(e)
    }
})

async function verifyVP(vpObj, challenge) {
    if (!vpObj) throw new Error('presentation is null')
    if (!challenge) throw new Error('challenge is null')
    const vc = vpObj.verifiableCredential[0];
    const isVerified = await hsSdkVC.verifyPresentation({
        presentation: vpObj,
        challenge: challenge,
        issuerDid: vc.proof.verificationMethod,
        holderDid: vpObj.proof.verificationMethod
    });
    return isVerified.verified;
}

server.listen(port, () => {
    console.log(`${TIME()} The server is running on port : ${port}`)
})