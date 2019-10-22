const dotenv = require('dotenv')
const os = require("os")
const TelegramBot = require('node-telegram-bot-api')

// Config
dotenv.config()
const token = process.env.TELEGRAM_TOKEN
const bot = new TelegramBot(token, {polling: true})

// ---------------------------------

const getCpuInfo = () => {
  const load = os.loadavg()
  const cpu = {
    load1: load[0],
    load5: load[1],
    load15: load[2],
    cores: os.cpus().length,
  }
  cpu.utilization = Math.min(Math.floor(load[0] * 100 / cpu.cores), 100)

  return cpu
}

const getMemoryInfo = () => {
	const mem = {
		free: os.freemem(),
		total: os.totalmem()
	}
	mem.percent = (mem.free * 100 / mem.total)

	return mem
}

const getUserInfo = () => {
	try {
		return os.userInfo()
	} catch (e) {
		return {}
	}
}

const getOsInfo = () => {
	return {
		uptime: os.uptime(),
		type: os.type(),
		release: os.release(),
		hostname: os.hostname(),
		arch: os.arch(),
		platform: os.platform(),
		user: getUserInfo()
	}
}
// ---------------------------------

const ADMIN_ID = process.env.ADMIN_ID
const MAX_CPU_LIMIT = 45
const INTERVAL = 600000

let lastInterval = undefined
let intervalID = undefined

// -------------- Bot commands ----------------
bot.onText(/\/start/, (msg) => {
  console.log('------------------------------------ New start')
  console.log(new Date())
  console.log(msg)
  console.log('------------------------------------ New start')

  chatId = msg.chat.id
  bot.sendMessage(msg.chat.id, `Welcome ${msg.chat.first_name}. Type /help to see the options`)
  watchCpu(chatId)
})

bot.onText(/\/help/, (msg) => {
  bot.sendMessage(msg.chat.id, `/cpu /mem /os /exit (admin)`)
})

bot.onText(/\/cpu/, (msg) => {
  bot.sendMessage(msg.chat.id, `cpu is at: ${getCpuInfo().utilization}%`)
})

bot.onText(/\/mem/, (msg) => {
  bot.sendMessage(msg.chat.id, JSON.stringify(getMemoryInfo()))
})

bot.onText(/\/os/, (msg) => {
  bot.sendMessage(msg.chat.id, JSON.stringify(getOsInfo()))
})

bot.onText(/\/exit/, (msg) => {
  bot.sendMessage(msg.chat.id, `shuting down...`)
  if (msg.from.id == ADMIN_ID) {
    setTimeout(() => {
      if (intervalID) clearInterval(intervalID)
      process.exit(1)
    }, 1000);
  }
})
// -------------- Bot commands ----------------


const watchCpu = chatId => {
  if (chatId) {
    intervalID = setInterval(() => {
      let cpu = getCpuInfo().utilization

      if (lastInterval >= MAX_CPU_LIMIT && cpu >= MAX_CPU_LIMIT) {
        console.log('------------------------------------ CPU Limit')
        console.log(new Date())
        console.log(`cpu is at ${cpu}%. Exceeding the established limit!`)
        console.log('------------------------------------ CPU Limit')
        bot.sendMessage(chatId, `cpu is at ${cpu}%. Exceeding the established limit!`)
      }

      lastInterval = cpu
    }, INTERVAL)
  }
}
