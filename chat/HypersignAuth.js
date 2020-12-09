const jwt = require('jsonwebtoken');
const hsdk = require('lds-sdk');
const { clientStore } = require('./config')


module.exports = class HypersignAuth {
    constructor(options = {}) {
        this.options = {};
        this.options.jwtExpiryInMilli = options ? options.jwtExpiryInMilli : 240000;
        this.options.jwtSecret = options ? options.jwtSecret : 'secretKey';

        this.hsSdkVC = hsdk.credential({ nodeUrl: "http://localhost:5000", didScheme: "did:hs" });
    }

    async verifyVP(vpObj, challenge) {
        if (!vpObj) throw new Error('presentation is null')
        if (!challenge) throw new Error('challenge is null')
        const vc = vpObj.verifiableCredential[0];
        const isVerified = await this.hsSdkVC.verifyPresentation({
            presentation: vpObj,
            challenge: challenge,
            issuerDid: vc.proof.verificationMethod,
            holderDid: vpObj.proof.verificationMethod
        });
        return isVerified.verified;
    }

    verifyVP(vpObj, challenge) {
        if (!vpObj) throw new Error('presentation is null')
        if (!challenge) throw new Error('challenge is null')
        const vc = vpObj.verifiableCredential[0];
        return new Promise((resolve, reject) => {
            return this.hsSdkVC.verifyPresentation({
                presentation: vpObj,
                challenge: challenge,
                issuerDid: vc.proof.verificationMethod,
                holderDid: vpObj.proof.verificationMethod
            }, (isVerified) => {
                resolve(isVerified.verified)
            });
        })
    }

    jwtSign(subject) {
        return new Promise((resolve, reject) => {
            return jwt.sign(subject, this.options.jwtSecret, { expiresIn: this.options.jwtExpiryInMilli }, (error, token) => {
                resolve(token)
            });
        })
    }

    // Public methods
    /////////////////
    authenticate(req, res, next) {
        const { challenge, vp } = req.body;
        const vpObj = JSON.parse(vp);
        const subject = vpObj['verifiableCredential'][0]['credentialSubject'];

        this.verifyVP(vpObj, challenge)
            .then((result) => {
                if (!result) res.send("Un-Authorized!");
                return this.jwtSign(subject)
            })
            .then((token) => {
                console.log('Token is created, token = ', token)
                const client = clientStore.getClient(challenge)
                console.log('Client fetched, clientID = ', client.clientId)
                const dataToExport = {
                    hs_userdata: subject,
                    hs_authorizationToken: token
                }
                console.log('Notifiying the browser')
                client.connection.sendUTF(this.getFormatedMessage.apply('end', { message: 'User is validated. Go to home page.', userdata: token }))
                clientStore.deleteClient(client.clientId);
                req.body.hsUserData = dataToExport
                next();
            })
            .catch(e => {
                res.status(403).send("Un-Authorized!")
            })
    }

    // Public methods
    /////////////////
    // async authenticate(req, res, next) {

    //     const { challenge, vp } = req.body;
    //     const vpObj = JSON.parse(vp);
    //     const subject = vpObj['verifiableCredential'][0]['credentialSubject'];
    //     console.log(this)

    //     if (!(await this.verifyVP.apply(vpObj, challenge))) res.send("Un-Authorized!");
    //     console.log('Presentation is verified successfully')

    //     const token = await jwt.sign(subject, this.options.jwtSecret, { expiresIn: this.options.jwtExpiryInMilli });
    //     console.log('Token is created, token = ', token)
    //     const client = clientStore.getClient(challenge)
    //     console.log('Client fetched, clientID = ', client.clientId)
    //     const dataToExport = {
    //         hs_userdata: subject,
    //         hs_authorizationToken: token
    //     }
    //     console.log('Notifiying the browser')
    //     client.connection.sendUTF(this.getFormatedMessage.apply('end', { message: 'User is validated. Go to home page.', userdata: token }))
    //     clientStore.deleteClient(client.clientId);
    //     req.body.hsUserData = dataToExport
    //     next();
    // }

    async authorize(req, res, next) {
        const authToken = req.headers['x-auth-token']
        if (authToken) {
            const data = await jwt.verify(authToken, this.options.jwtSecret)
                // if (err) res.status(403).send({ status: 403, message: "Unauthorized.", error: null })
            req.body.userData = data;
            next()
        } else {
            res.status(403).send({ status: 403, message: "Please send the x-auth-token in the header", error: null })
        }
    }

    getFormatedMessage(op, data) {
        return JSON.stringify({
            op,
            data
        })
    }


}