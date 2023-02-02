import {
  Box,
  Button,
  Center,
  Flex,
  Heading,
  Input,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr
} from '@chakra-ui/react'
import { Alchemy, Network, Utils } from 'alchemy-sdk'
import { ethers } from 'ethers'
import { useState } from 'react'
import ClipLoader from 'react-spinners/ClipLoader'

function App () {
  const [userAddress, setUserAddress] = useState('')
  const [results, setResults] = useState([])
  const [hasQueried, setHasQueried] = useState(false)
  const [tokenDataObjects, setTokenDataObjects] = useState([])
  const [loadingInProgress, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [loggedAccount, setLoggedAccount] = useState('')

  async function connectWallet () {
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      await provider.send('eth_requestAccounts', [])
      const newAccount = await provider.getSigner()
      const address = await newAccount.getAddress()
      setUserAddress(address)
      setLoggedAccount(address)
    } else {
      console.log('Please Install MetaMask!!!')
    }
  }

  async function getTokenBalance () {
    const config = {
      apiKey: import.meta.env.VITE_ALCHEMY_KEY || '',
      network: Network.ETH_MAINNET
    }

    const alchemy = new Alchemy(config)

    if (!userAddress) {
      setErrorMessage('Missing address')
      return false
    }
    setErrorMessage('')

    // Check if address is an ENS
    const address = await alchemy.core.resolveName(userAddress)
    if (address) setUserAddress(address)

    // Active loading
    setLoading(true)

    try {
      const data = await alchemy.core.getTokenBalances(userAddress)

      // Remove empty tokens
      data.tokenBalances = data.tokenBalances.map(item => {
        item.tokenBalance = item.tokenBalance.toString()
        return item
      }).filter((item) => item.tokenBalance > 0)

      setResults(data.tokenBalances)

      const tokenData = []

      for (const item of data.tokenBalances) {
        const result = await alchemy.core.getTokenMetadata(
          item.contractAddress
        )
        tokenData.push(result)
      }

      // Remove loading
      setLoading(false)

      setTokenDataObjects(tokenData)
      setHasQueried(true)
    } catch (err) {
      // Remove loading
      setLoading(false)

      // Reset results
      setTokenDataObjects([])
      setResults([])

      // Set error message
      if (err.message.includes('ENS name not configured')) {
        setErrorMessage('Check address or ENS name')
      } else {
        setErrorMessage('Error during API call')
      }
    }
  }
  return (
    <Box w='100vw'>
      {!loggedAccount &&
        (
          <Button
            className='loginButton'
            onClick={connectWallet}
          >
            Get your address from Wallet
          </Button>
        )}
      {loadingInProgress && (
        <div className='loader-container'>
          <ClipLoader color='#fff' loading={loadingInProgress} size={150} />
        </div>)}
      <Center>
        <Flex
          alignItems='center'
          justifyContent='center'
          flexDirection='column'
        >
          <Heading mb={0} fontSize={36}>
            ERC-20 Token Indexer
          </Heading>
          <Text>
            Plug in an address and this website will return all of its ERC-20
            token balances!
          </Text>
        </Flex>
      </Center>
      <Flex
        w='100%'
        flexDirection='column'
        alignItems='center'
        justifyContent='center'
      >
        <Heading mt={42}>
          Get all the ERC-20 token balances of this address:
        </Heading>
        <Input
          onChange={(e) => setUserAddress(e.target.value)}
          color='black'
          w='600px'
          textAlign='center'
          p={4}
          bgColor='white'
          fontSize={24}
          required
          value={userAddress}
        />
        <Button fontSize={20} onClick={getTokenBalance} mt={36}>
          Check ERC-20 Token Balances
        </Button>

        {errorMessage !== '' && (
          <p className='errorMessage'>{errorMessage}</p>
        )}

        {hasQueried &&
          (
            <div>
              <Heading my={36}>ERC-20 token balances:</Heading>
              {results.length > 0
                ? (
                  <div className='containerTable'>
                    <TableContainer w='90vw'>
                      <Table size='sm'>
                        <Thead>
                          <Tr>
                            <Th>Name</Th>
                            <Th>Symbol</Th>
                            <Th isNumeric>Balance</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {results.map((e, i) => {
                            return (
                              <Tr
                                key={i}
                              >
                                <Td>${tokenDataObjects[i].name}</Td>
                                <Td>${tokenDataObjects[i].symbol}</Td>
                                <Td isNumeric>{Utils.formatUnits(
                                  e.tokenBalance,
                                  tokenDataObjects[i].decimals
                                )}
                                </Td>
                              </Tr>
                            )
                          })}
                        </Tbody>
                      </Table>
                    </TableContainer>
                    <small>Note: only the first 1000 results are shown</small>
                  </div>
                  )
                : <p className='noTokens'>No tokens with positive balance found</p>}
            </div>
          )}
      </Flex>
    </Box>
  )
}

export default App
