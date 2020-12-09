const jwt = require('jsonwebtoken');
const hsdk = require('lds-sdk');
const { clientStore } = require('./config')

const options = { nodeUrl: "http://localhost:5000", didScheme: "did:hs" }
const hsSdkVC = hsdk.credential(options)
const jwtExpiryInMilli = 240000
const jwtSecret = process.env.JWT_SECRET || 'secretKey';

function getFormatedMessage(op, data) {
    return JSON.stringify({
        op,
        data
    })
}

const verifyVP = async(vpObj, challenge) => {
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

const authenticate = async(req, res, next) => {
    const { challenge, vp } = req.body;
    const vpObj = JSON.parse(vp);
    const subject = vpObj['verifiableCredential'][0]['credentialSubject'];

    if (!(await verifyVP(vpObj, challenge))) res.send("Un-Authorized!");
    console.log('Presentation is verified successfully')

    const token = await jwt.sign(subject, jwtSecret, { expiresIn: jwtExpiryInMilli });
    console.log('Toke is created, token = ', token)
    const client = clientStore.getClient(challenge)
    console.log('Client fetched, clientID = ', client.clientId)
    const dataToExport = {
        hs_userdata: subject,
        hs_authorizationToken: token
    }
    console.log('Notifiying the browser')
    client.connection.sendUTF(getFormatedMessage('end', { message: 'User is validated. Go to home page.', userdata: token }))
    clientStore.deleteClient(client.clientId);
    req.body.hsUserData = dataToExport
    next();
}

const authorize = async(req, res, next) => {
    const authToken = req.headers['x-auth-token']
    if (authToken) {
        const data = await jwt.verify(authToken, jwtSecret)
            // if (err) res.status(403).send({ status: 403, message: "Unauthorized.", error: null })
        req.body.userData = data;
        next()
    } else {
        res.status(403).send({ status: 403, message: "Please send the x-auth-token in the header", error: null })
    }
}

module.exports = {
    authenticate,
    authorize
}