const fs = require('fs')
const fsExtra = require('fs-extra')
const { subtask, task } = require('hardhat/config')
const { TASK_CLEAN, TASK_COMPILE } = require('hardhat/builtin-tasks/task-names')
// require('@nomiclabs/hardhat-waffle')
// require('@nomiclabs/hardhat-ethers')
require('hardhat-deploy')
require('hardhat-contract-sizer')
require('@openzeppelin/hardhat-upgrades')

require('dotenv').config({ path: './.env' })

let mnemonic = process.env.MNEMONIC
if (!mnemonic) {
  mnemonic = 'test test test test test test test test test test test junk'
}
const mnemonicAccounts = {
  mnemonic,
}

const account = {
  Testnet: process.env.TESTNET_PRIVATE_KEY,
  Mainnet: process.env.MAINNET_PRIVATE_KEY,
}

// Default output dir to abi contracts in frontend
const contractsFrontDir = './compiled'

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
const config = {
  solidity: {
    version: '0.8.20',
    settings: {
      evmVersion: "paris",
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  paths: {
    sources: './src',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts',
  },
  defaultNetwork: 'optimismSepolia',
  networks: {
    hardhat: {
      accounts: mnemonicAccounts,
    },
    optimismSepolia: {
      url: 'https://sepolia.optimism.io',
      chainId: 11155420,
      accounts: account.Testnet ? [account.Testnet] : mnemonicAccounts,
    },
  },
  namedAccounts: {
    deployer: {
      default: 0, // here this will by default take the first account as deployer
    },
  },
  mocha: {
    timeout: 50000, // 50 seconds timeout
  },
}

// // This is a sample Hardhat task. To learn how to create your own go to
// // https://hardhat.org/guides/create-task.html
// task('accounts', 'Prints the list of accounts', async (taskArgs, hre) => {
//   const accounts = await hre.ethers.getSigners()
//   accounts.forEach((acc) => {
//     console.log(acc.address)
//   })
// })

task(TASK_CLEAN, 'Clean all artifacts & folder contracts in frontend').setAction(async (taskArgs, hre, runSuper) => {
  await runSuper()
  if (fs.existsSync('./deployments')) {
    fs.rmdirSync('./deployments', { recursive: true })
  }
  await hre.run('clean-front-contracts')
})

subtask('clean-front-contracts', 'Clear frontend contracts folder').setAction(async () => {
  // Clear if exist
  if (fs.existsSync(contractsFrontDir)) {
    fsExtra.emptyDirSync(contractsFrontDir)
  }
})

task(TASK_COMPILE, 'Deploy contracts').setAction(async (taskArgs, hre, runSuper) => {
  console.log('TASK_COMPILE', taskArgs)
  if (!fs.existsSync(contractsFrontDir)) {
    fs.mkdirSync(contractsFrontDir, { recursive: true })
  }
  await runSuper(taskArgs)
})

module.exports = config
