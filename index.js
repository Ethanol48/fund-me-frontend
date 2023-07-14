import { ethers } from "./ethers-5.6.esm.min.js"
import { abi, contractAddress, INITIAL_BLOCK } from "./constants.js"

const balanceDisplay = document.getElementById("balanceText")
const connectButton = document.getElementById("connectButton")
const withdrawButton = document.getElementById("withdrawButton")
const fundButton = document.getElementById("fundButton")
const balanceButton = document.getElementById("balanceButton")
const logButton = document.getElementById("getLogs")
const loadingLogs = document.querySelector(".hidden")
const logsDisplay = document.getElementById("logsDisplay")

console.log(loadingLogs)

logButton.onclick = getFundedLogs
connectButton.onclick = connect
withdrawButton.onclick = withdraw
fundButton.onclick = fund
balanceButton.onclick = getBalance

let connected = false

console.log(`Contract address in Sepolia: ${contractAddress}`)

async function connect() {
  if (typeof window.ethereum !== "undefined") {
    try {
      const chainId = await window.ethereum.request({ method: "eth_chainId" })
      console.log(chainId)
      if (chainId !== "0xaa36a7") {
        connected = false
        connectButton.innerHTML = "Please connect to Sepolia"
      } else if (chainId === "0xaa36a7") {
        connected = true
      }
    } catch (err) {
      console.error(err)
    }

    try {
      await ethereum.request({ method: "eth_requestAccounts" })
    } catch (error) {
      console.log(error)
    }

    if (connected) {
      connectButton.style.display = "none"
      const accounts = await ethereum.request({ method: "eth_accounts" })
      getFundedLogs()
      getBalance()
    }
  } else {
    connectButton.innerHTML = "Please install MetaMask"
  }
}

async function withdraw() {
  console.log(`Withdrawing...`)
  if (typeof window.ethereum !== "undefined") {
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    await provider.send("eth_requestAccounts", [])
    const signer = provider.getSigner()
    const contract = new ethers.Contract(contractAddress, abi, signer)
    try {
      const transactionResponse = await contract.withdraw()
      await listenForTransactionMine(transactionResponse, provider)
      await transactionResponse.wait(1)
    } catch (error) {
      console.log(error)
    }
  } else {
    withdrawButton.innerHTML = "Please install MetaMask"
  }
}

async function fund() {
  const ethAmount = document.getElementById("ethAmount").value
  console.log(`Funding with ${ethAmount}...`)
  if (typeof window.ethereum !== "undefined") {
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const signer = provider.getSigner()
    const contract = new ethers.Contract(contractAddress, abi, signer)
    try {
      const transactionResponse = await contract.fund({
        value: ethers.utils.parseEther(ethAmount),
      })
      await listenForTransactionMine(transactionResponse, provider)
    } catch (error) {
      console.log(error)
    }
  } else {
    fundButton.innerHTML = "Please install MetaMask"
  }
}

async function getBalance() {
  console.log(`Getting balance...`)

  if (typeof window.ethereum !== "undefined") {
    console.log("window.ethereum is defined")

    const provider = new ethers.providers.Web3Provider(window.ethereum)
    try {
      const balance = await provider.getBalance(contractAddress)
      console.log(`balance is ${ethers.utils.formatEther(balance)}`)
      balanceDisplay.innerHTML = `${ethers.utils.formatEther(balance)} ETH`
    } catch (error) {
      console.log(error)
    }
  } else {
    balanceButton.innerHTML = "Please install MetaMask"
  }
}

function listenForTransactionMine(transactionResponse, provider) {
  console.log(`Mining ${transactionResponse.hash}`)
  return new Promise((resolve, reject) => {
    provider.once(transactionResponse.hash, (transactionReceipt) => {
      console.log(
        `Completed with ${transactionReceipt.confirmations} confirmations. `
      )
      resolve()
    })
  })
}

function getTemplateLogsAndAppendToDOM(
  funderAddress,
  amountEth,
  parentElement,
  txHash
) {
  const logContainer = document.createElement("div")

  logContainer.classList.add("log-container")

  parentElement.appendChild(logContainer)

  const funderElem = document.createElement("div")
  funderElem.classList.add("funder")
  const fundLink = document.createElement("a")

  funderElem.innerHTML = `funder: `

  // take half of the length of the funder address and add 3 points to it '...'
  fundLink.innerHTML = `${funderAddress}`.slice(0, 20) + "..."
  fundLink.href = `https://sepolia.etherscan.io/tx/${txHash}`

  funderElem.appendChild(fundLink)

  const amountElem = document.createElement("p")
  amountElem.classList.add("amount")
  amountElem.innerHTML = `amount: ${amountEth} ETH`

  logContainer.appendChild(funderElem)
  logContainer.appendChild(amountElem)

  return logContainer
}

async function getFundedLogs() {
  console.log(`Getting funded logs...`)

  logsDisplay.innerHTML = ""

  loadingLogs.classList.toggle("hidden")

  const provider = new ethers.providers.Web3Provider(window.ethereum)
  const contract = new ethers.Contract(contractAddress, abi, provider)
  const filter = contract.filters.Funded()
  const logs = await contract.queryFilter(
    filter,
    INITIAL_BLOCK,
    provider.blockNumber
  )

  console.log(logs)

  console.log(`funded logs`)
  logs.forEach((log) => {
    const funder = log.args[0]
    const funds = ethers.utils.formatEther(log.args[1].toString())
    const tranxHash = log.transactionHash

    getTemplateLogsAndAppendToDOM(funder, funds, logsDisplay, tranxHash)
  })

  logButton.innerHTML = "Refresh Logs"
  loadingLogs.classList.toggle("hidden")
}

// getFundedLogs()
