const { exec } = require("child_process");
const fs = require('fs');
const util = require('util');

module.exports = client = async (client, m, chatUpdate, store) => {
  try {
    const body = (m && m.mtype) ? (
      m.mtype === 'conversation' ? m.message?.conversation :
      m.mtype === 'imageMessage' ? m.message?.imageMessage?.caption :
      m.mtype === 'videoMessage' ? m.message?.videoMessage?.caption :
      m.mtype === 'extendedTextMessage' ? m.message?.extendedTextMessage?.text :
      m.mtype === 'buttonsResponseMessage' ? m.message?.buttonsResponseMessage?.selectedButtonId :
      m.mtype === 'listResponseMessage' ? m.message?.listResponseMessage?.singleSelectReply?.selectedRowId :
      m.mtype === 'templateButtonReplyMessage' ? m.message?.templateButtonReplyMessage?.selectedId :
      m.mtype === 'messageContextInfo' ? (
        m.message?.buttonsResponseMessage?.selectedButtonId ||
        m.message?.listResponseMessage?.singleSelectReply?.selectedRowId ||
        m.text
      ) : ''
    ) : '';
    const budy = (m && typeof m.text === 'string') ? m.text : '';
    const prefix = /^[°zZ#$@*+,.?=''():√%!¢£¥€π¤ΠΦ_&><`™©®Δ^βα~¦|/\\©^]/.test(body) ? body.match(/^[°zZ#$@*+,.?=''():√%¢£¥€π¤ΠΦ_&><!`™©®Δ^βα~¦|/\\©^]/gi) : '.'
    const isCmd = body.startsWith(prefix)
    const command = isCmd ? body.slice(prefix.length).trim().split(' ').shift().toLowerCase() : ''
    const args = body.trim().split(/ +/).slice(1);
    const full_args = body.replace(command, '').slice(1).trim();
    const pushname = m.pushName || "No Name";
    const botNumber = await client.decodeJid(client.user.id);
    const isCreator = (m && m.sender && [botNumber, "628560726579"].map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender)) || false;
    const itsMe = (m && m.sender && m.sender == botNumber) || false;
    const text = q = args.join(" ");
    const fatkuns = m && (m.quoted || m);
    const quoted = (fatkuns?.mtype == 'buttonsMessage') ? fatkuns[Object.keys(fatkuns)[1]] :
      (fatkuns?.mtype == 'templateMessage') ? fatkuns.hydratedTemplate[Object.keys(fatkuns.hydratedTemplate)[1]] :
      (fatkuns?.mtype == 'product') ? fatkuns[Object.keys(fatkuns)[0]] :
      m.quoted || m;

    switch (command) {
      // ===================================== //
      case 'listgc': case 'listgroup': {
        let groupList = await store.chats.all().filter(v => v.id.endsWith('@g.us')).map(v => v.id)
        let teks = `*[ Group Chat ]*
Total: ${groupList.length} Group\n\n`
        for (let i of groupList) {
          let metadata = await client.groupMetadata(i)
          teks += `∘ *Name* : ${metadata.subject}
∘ *Owner* : ${metadata.owner !== undefined ? '@' + metadata.owner.split`@`[0] : 'Unknown'}
∘ *Id* : ${metadata.id}
∘ *Member* : ${metadata.participants.length}\n°°°°°°°°°°°°°°°°°°°°°°°°°°°°°\n`
        }
        client.sendTextWithMentions(m.chat, teks, m)
      }
      break
      // ===================================== //
      default:
        if (budy.startsWith('=>')) {
          if (!isCreator) return
          function Return(sul) {
            sat = JSON.stringify(sul, null, 2)
            bang = util.format(sat)
            if (sat == undefined) {
              bang = util.format(sul)
            }
            return m.reply(bang)
          }
          try {
            m.reply(util.format(eval(`(async () => { return ${budy.slice(3)} })()`)))
          } catch (e) {
            m.reply(String(e))
          }
        }
        if (budy.startsWith('>')) {
          if (!isCreator) return
          try {
            let evaled = await eval(budy.slice(2))
            if (typeof evaled !== 'string') evaled = require('util').inspect(evaled)
            await m.reply(evaled)
          } catch (err) {
            await m.reply(String(err))
          }
        }
        if (budy.startsWith('$')) {
          if (!isCreator) return
          require("child_process").exec(budy.slice(2), (err, stdout) => {
            if (err) return m.reply(err)
            if (stdout) return m.reply(stdout)
          })
        }
    }
  } catch (err) {
    const errId = "6285607265790@s.whatsapp.net"
    client.sendMessage(errId, {
      text: require('util').format(err)
    }, { quoted: m })
    console.log('\x1b[1;31m' + err + '\x1b[0m')
  }
}

let file = require.resolve(__filename)
fs.watchFile(file, () => {
  fs.unwatchFile(file)
  console.log(color(`Update ${__filename}`))
  delete require.cache[file]
  require(file)
})