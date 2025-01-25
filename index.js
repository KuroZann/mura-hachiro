const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    makeInMemoryStore,
    jidDecode,
    generateWAMessage,
    generateWAMessageFromContent,
    downloadContentFromMessage
} = require("baileys");
const pino = require("pino");
const fs = require('fs')
const path = require('path')
const { Boom } = require("@hapi/boom");
const PhoneNumber = require("awesome-phonenumber");
const readline = require("readline");
const { smsg } = require("./simple");

const store = makeInMemoryStore({
	logger: pino().child({
		level: "silent",
		stream: "store"
	})
});

const question = (text) => {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});
	return new Promise((resolve) => {
		rl.question(text, resolve)
	})
};

// don't delete this code if you don't want an error
async function start() {
    const { state, saveCreds } = await useMultiFileAuthState("session")
    const client = makeWASocket({
        logger: pino({ level: "silent" }),
        printQRInTerminal: false,
        auth: state,
        browser: [ 'Mac OS', 'Safari', '10.15.7' ]
    });
    
    if (!client.authState.creds.registered) {
        const phoneNumber = await question('Input Number Start With Code Cuntry 62xxxx :\n');
        let code = await client.requestPairingCode(phoneNumber);
        code = code?.match(/.{1,4}/g)?.join("-") || code;
        console.log('This ur code :', code);
    }
    
    store.bind(client.ev);
    
    client.ev.on("messages.upsert", async (chatUpdate) => {
        try {
            mek = chatUpdate.messages[0];
            if (!mek.message) return;
            mek.message = Object.keys(mek.message)[0] === "ephemeralMessage" ? mek.message.ephemeralMessage.message : mek.message;
            if (mek.key && mek.key.remoteJid === "status@broadcast") return;
            if (!client.public && !mek.key.fromMe && chatUpdate.type === "notify") return;
            if (mek.key.id.startsWith("BAE5") && mek.key.id.length === 16) return;
            m = smsg(client, mek, store);
            require("./case.js")(client, m, chatUpdate, store);
        } catch (err) {
            console.log(err);
        }
    });
    
    client.sendMedia = async (jid, path, quoted, options = {}) => {
      let { ext, mime, data } = await conn.getFile(path)
      messageType = mime.split("/")[0]
      pase = messageType.replace('application', 'document') || messageType
      return await conn.sendMessage(jid, {
        [`${pase}`]: data,
        mimetype: mime,
        ...options
      }, { quoted })
    };
    
    client.decodeJid = (jid) => {
        if (!jid) return jid;
        if (/:\d+@/gi.test(jid)) {
            let decode = jidDecode(jid) || {};
            return (decode.user && decode.server && decode.user + "@" + decode.server) || jid;
        } else return jid;
    };
    
    client.public = false;
    
    client.serializeM = (m) => smsg(client, m, store);
    client.ev.on('connection.update', async (update) => {
    	const { connection, lastDisconnect } = update
    	try {
    	if (connection === 'close') {
    		let reason = new Boom(lastDisconnect?.error)?.output.statusCode
    			if (reason === DisconnectReason.badSession) {
    				console.log(`Bad Session File, Please Delete Session and Scan Again`);
    				start()
    			} else if (reason === DisconnectReason.connectionClosed) {
    				console.log("Connection closed, reconnecting....");
    				start();
    			} else if (reason === DisconnectReason.connectionLost) {
    				console.log("Connection Lost from Server, reconnecting...");
    				start();
    			} else if (reason === DisconnectReason.connectionReplaced) {
    				console.log("Connection Replaced, Another New Session Opened, Please Close Current Session First");
    				start()
    			} else if (reason === DisconnectReason.loggedOut) {
    				console.log(`Device Logged Out, Please Scan Again And Run.`);
    				start();
    			} else if (reason === DisconnectReason.restartRequired) {
    				console.log("Restart Required, Restarting...");
    				start();
    			} else if (reason === DisconnectReason.timedOut) {
    				console.log("Connection TimedOut, Reconnecting...");
    				start();
    			} else client.end(`Unknown DisconnectReason: ${reason}|${connection}`)
    		}
    		if (update.connection == "connecting" || update.receivedPendingNotifications == "false") {
    			console.log(`[ Connecting... ]`)
    		}
    		if (update.connection == "open" || update.receivedPendingNotifications == "true") {
    			console.log(`[ Connected ✓ ] ` + JSON.stringify(client.user, null, 2))
    		}
    	} catch (err) {
    		console.log('Error di connection update ' + err)
    		start();
    	}
    })
    
    client.ev.on("creds.update", saveCreds);
    
    client.downloadMediaMessage = async (message) => {
      let mime = (message.msg || message).mimetype || ''
      let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
      const stream = await downloadContentFromMessage(message, messageType)
      let buffer = Buffer.from([])
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk])
      }
      return buffer
    }
    
    client.sendTextWithMentions = async (jid, text, quoted, options = {}) => {
      return await client.sendMessage(jid, {
        text: text,
        contextInfo: {
          mentionedJid: [...text.matchAll(/@(\d{0,16})/g)].map(v => v[1] + '@s.whatsapp.net')
        }, ...options
      }, { quoted })
    }
    
    client.sendText = (jid, text, quoted = '', options) =>
      client.sendMessage(jid, {
        text: text, 
        ...options
      }, 
    { quoted, ...options });
    
    client.sendPoll = (jid, name = '', values = [], selectableCount = 1) => {
        return client.sendMessage(jid, {
            poll: {
                name, values, selectableCount
            }
        })
    }
	return client
}
start()

process.on('uncaughtException', function(err) {
    console.log('Caught exception: ', err)
})