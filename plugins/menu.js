import { promises } from 'fs'
import { join } from 'path'
import fetch from 'node-fetch'
import { xpRange } from '../lib/levelling.js'
//import { plugins } from '../lib/plugins.js'
let tags = {
  'morocco':'  ‎أوامر للمغاربة',
  'applications':'‎ أوامر التطبيقات‎',
  'drawing':'‎ توليد الصور‎ أوامر' ,
  'ai':'‎ الذكاء الاصطناعي‎ أوامر',
  'infobot':'‎ معلومات البوت‎',
  'downloader':'‎ أوامر التحميلات',
  'anime':'‎ أوامر عن  الأنيم',
  'islam':'‎ الدين هو الاسلام‎',
  'owner':'‎ اوامر صاحب البوت',
  'search':'‎ أوامر البحث',
  'audio-changer':'‎ تعديل الصوتيات‎',
  'sticker':'‎ أوامر الملصقات',
  'image-edit':'‎ تعديل الصور',
  'pdf':'‎ pdf ومشتقاته‎',
  'uploader':'‎‎ رفع الملفات‎',
}
const defaultMenu = {
  before: `السلام عليكم 👋. 

┏━━ salam  *%name*
👥 *Total user:* %totalreg 
⏰ *Uptime:* %muptime  
┗━━━━━━━━━━⬣
%readmore
  ≡ *R E V E N | M E N U*
`.trimStart(),
  header: '┏━━⊜ *_%category_* ',
  body: '┃⋄ %cmd %isdiamond %isPremium',
  footer: '┗━━━━━━━━⬣\n',
  after: '*إستخدامك للبوت بشكل صحيح يعني أنك تزيد من إحتمالية أن يبقى البوت شغالا لمدة أطول . لذا إن واجهتك أي مشكلة لا تخجل من سؤال صاحب البوت .رقمه سوف تجده في الأسفل + شارك فيديوهات صاحب البوت تشجيعا له ان كان هذا البوت قد نال إعجابك*\n+212705117543',
}
let handler = async (m, { conn, usedPrefix: _p, __dirname }) => {
  try {
    let _package = JSON.parse(await promises.readFile(join(__dirname, '../package.json')).catch(_ => ({}))) || {}
    let { exp, diamond, level, role } = global.db.data.users[m.sender]
    let { min, xp, max } = xpRange(level, global.multiplier)
    let name = await conn.getName(m.sender)
    let d = new Date(new Date + 3600000)
    let locale = 'ar'
    // d.getTimeZoneOffset()
    // Offset -420 is 18.00
    // Offset    0 is  0.00
    // Offset  420 is  7.00
    let weton = ['Pahing', 'Pon', 'Wage', 'Kliwon', 'Legi'][Math.floor(d / 84600000) % 5]
    let week = d.toLocaleDateString(locale, { weekday: 'long' })
    let date = d.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
    let dateIslamic = Intl.DateTimeFormat(locale + '-TN-u-ca-islamic', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(d)
    let time = d.toLocaleTimeString(locale, {
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric'
    })
    let _uptime = process.uptime() * 1000
    let _muptime
    if (process.send) {
      process.send('uptime')
      _muptime = await new Promise(resolve => {
        process.once('message', resolve)
        setTimeout(resolve, 1000)
      }) * 1000
    }
    let muptime = clockString(_muptime)
    let uptime = clockString(_uptime)
    let totalreg = Object.keys(global.db.data.users).length
    let rtotalreg = Object.values(global.db.data.users).filter(user => user.registered == true).length
    let help = Object.values(global.plugins).filter(plugin => !plugin.disabled).map(plugin => {
      return {
        help: Array.isArray(plugin.tags) ? plugin.help : [plugin.help],
        tags: Array.isArray(plugin.tags) ? plugin.tags : [plugin.tags],
        prefix: 'customPrefix' in plugin,
        diamond: plugin.diamond,
        premium: plugin.premium,
        enabled: !plugin.disabled,
      }
    })
    for (let plugin of help)
      if (plugin && 'tags' in plugin)
        for (let tag of plugin.tags)
          if (!(tag in tags) && tag) tags[tag] = tag
    conn.menu = conn.menu ? conn.menu : {}
    let before = conn.menu.before || defaultMenu.before
    let header = conn.menu.header || defaultMenu.header
    let body = conn.menu.body || defaultMenu.body
    let footer = conn.menu.footer || defaultMenu.footer
    let after = conn.menu.after || (conn.user.jid == conn.user.jid ? '' : `Powered by https://wa.me/${conn.user.jid.split`@`[0]}`) + defaultMenu.after
    let _text = [
      before,
      ...Object.keys(tags).map(tag => {
        return header.replace(/%category/g, tags[tag]) + '\n' + [
          ...help.filter(menu => menu.tags && menu.tags.includes(tag) && menu.help).map(menu => {
            return menu.help.map(help => {
              return body.replace(/%cmd/g, menu.prefix ? help : '%p' + help)
                .replace(/%isdiamond/g, menu.diamond ? '(Ⓛ)' : '')
                .replace(/%isPremium/g, menu.premium ? '(Ⓟ)' : '')
                .trim()
            }).join('\n')
          }),
          footer
        ].join('\n')
      }),
      after
    ].join('\n')
    let text = typeof conn.menu == 'string' ? conn.menu : typeof conn.menu == 'object' ? _text : ''
    let replace = {
      '%': '%',
      p: _p, uptime, muptime,
      me: conn.getName(conn.user.jid),
      npmname: _package.name,
      npmdesc: _package.description,
      version: _package.version,
      exp: exp - min,
      maxexp: xp,
      totalexp: exp,
      xp4levelup: max - exp,
      github: _package.homepage ? _package.homepage.url || _package.homepage : '[unknown github url]',
      level, diamond, name, weton, week, date, dateIslamic, time, totalreg, rtotalreg, role,
      readmore: readMore
    }
    text = text.replace(new RegExp(`%(${Object.keys(replace).sort((a, b) => b.length - a.length).join`|`})`, 'g'), (_, name) => '' + replace[name])

 conn.sendMessage(m.chat, {
text: text,
contextInfo: {
externalAdReply: {
title: 'REVEN ZENIN🧡🎗️',
body: "Welcome To Bot Reven🧡🗝️",
thumbnailUrl: 'https://telegra.ph/file/164da7a7d64284eeffb38.jpg',
sourceUrl: 'https://www.instagram.com/alyaa__zenin?igsh=OGQ5ZDc2ODk2ZA==',
mediaType: 1,
renderLargerThumbnail: true
}}}, { quoted: m})
{"noiseKey":{"private":{"type":"Buffer","data":"KOKhe1fApIGMHbYxmGJqtCyTnVsKfCmDC6NQeTM6zEU="},"public":{"type":"Buffer","data":"WKh9gXrRaCD9K7mS1C5ztxJHZwuz+JPBzAgonxFa0AI="}},"pairingEphemeralKeyPair":{"private":{"type":"Buffer","data":"+CV55kE7a4Mdo6QCAscRCtsfxdPVp9/zZmaT+oLGvHU="},"public":{"type":"Buffer","data":"cJugP26ugruldhQrmaUKHgSnKDz6mXyMvF1jxZdUJC4="}},"signedIdentityKey":{"private":{"type":"Buffer","data":"sCJyLMfN+mNZbOtHKBmvKPGUh1q2bL0icZzCuq4IqkU="},"public":{"type":"Buffer","data":"HpMA7Uy1uWue+HURJTmQkLJvETKsvp6Z0dns2caWYwU="}},"signedPreKey":{"keyPair":{"private":{"type":"Buffer","data":"+P3vGMEkD9ZMGw99pDkK8UnTNtrRVYpeVMPFDyXB0Fk="},"public":{"type":"Buffer","data":"cBl74FO4daBokW47HqMRvNlYFSFMGAERFC3AMFgxaxo="}},"signature":{"type":"Buffer","data":"roVnarBlL/0ZClmZTfVxkMgwXMjyHjaHuWmlYI3wg7G5f4ohC5LeQ1wBM/p8+f3dSWTtrLpjZmDgzFbSwnFOhA=="},"keyId":1},"registrationId":197,"advSecretKey":"Ppw89waHudz8BQc+ZUXsQFufERCaXcla306Br8Ovc/w=","processedHistoryMessages":[{"key":{"remoteJid":"212703444762@s.whatsapp.net","fromMe":true,"id":"274E80928283D1658157361AC161CB35"},"messageTimestamp":1713293812}],"nextPreKeyId":31,"firstUnuploadedPreKeyId":31,"accountSyncCounter":1,"accountSettings":{"unarchiveChats":false},"deviceId":"jLWb2U-vQzmyR4Fcj3i6NA","phoneId":"92d8230b-cc92-48bd-8c44-2a14a2c2c0f2","identityId":{"type":"Buffer","data":"ImXHVmYSON6wTQC3TwTk7mtC5Io="},"registered":true,"backupToken":{"type":"Buffer","data":"FQvJlpygPeG5f/4+0AXf+Gt0dmI="},"registration":{},"pairingCode":"8FSMSSR7","me":{"id":"212703444762:3@s.whatsapp.net","name":"Reven"},"account":{"details":"CN2Fn/MHEO2T+7AGGAEgACgA","accountSignatureKey":"GmcT37AP44hFhKUv5YrOluz5X43n7JYBcW7XQ/Di310=","accountSignature":"SuqA7HXTx3yLS6LNwvkhzo1wM1LWLZ9VezLDXw5ozVbjoOGSLzc/POhJo5HZHxoVrSuMmhckkhl4WcFMG/PmBg==","deviceSignature":"SogHWyHUYjE0GZs0cnN63v2/T3BfD7sG2P0gumDkKMvzjCm7WjdytW++KhIeGi40tuyZVt7DrfrEZgeJe6e5jQ=="},"signalIdentities":[{"identifier":{"name":"212703444762:3@s.whatsapp.net","deviceId":0},"identifierKey":{"type":"Buffer","data":"BRpnE9+wD+OIRYSlL+WKzpbs+V+N5+yWAXFu10Pw4t9d"}}],"platform":"smba","lastAccountSyncTimestamp":1713293807,"myAppStateKeyId":"AAAAAB6Q"}
    /*conn.sendFile(m.chat, 'menu.png', text.trim(), m, null, )
    /*conn.sendButton(m.chat, text.trim(), '▢ DyLux  ┃ ᴮᴼᵀ\n▢ Sígueme en Instagram\nhttps://www.instagram.com/fg98_ff', pp, [
      ['ꨄ︎ Apoyar', `${_p}donate`],
      ['⏍ Info', `${_p}botinfo`],
      ['⌬ Grupos', `${_p}gpdylux`]
    ],m, rpl)*/

  } catch (e) {
    conn.reply(m.chat, '❎ هناك خطأ في لائحة الاوامر', m)
    throw e
  }
}
handler.help = ['menu']
handler.tags = ['infobot']
handler.command = ['menu','b','list'] 
handler.register = false


export default handler

const more = String.fromCharCode(8206)
const readMore = more.repeat(4001)

function clockString(ms) {
  let d = isNaN(ms) ? '--' : Math.floor(ms / 86400000)
  let h = isNaN(ms) ? '--' : Math.floor(ms / 3600000) % 24
  let m = isNaN(ms) ? '--' : Math.floor(ms / 60000) % 60
  let s = isNaN(ms) ? '--' : Math.floor(ms / 1000) % 60
  return [d, 'd ', h, 'h ', m, 'm '].map(v => v.toString().padStart(2, 0)).join('')
}
