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
import { useState } from 'react'
import ClipLoader from 'react-spinners/ClipLoader'

function App () {
  const [userAddress, setUserAddress] = useState('')
  const [results, setResults] = useState([])
  const [hasQueried, setHasQueried] = useState(false)
  const [tokenDataObjects, setTokenDataObjects] = useState([])
  const [loadingInProgress, setLoading] = useState(false)

  async function getTokenBalance () {
    const config = {
      apiKey: import.meta.env.VITE_ALCHEMY_KEY || '',
      network: Network.ETH_MAINNET
    }

    const alchemy = new Alchemy(config)

    // Active loading
    setLoading(true)

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
  }
  return (
    <Box w='100vw'>
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
        />
        <Button fontSize={20} onClick={getTokenBalance} mt={36} bgColor='blue'>
          Check ERC-20 Token Balances
        </Button>

        <Heading my={36}>ERC-20 token balances:</Heading>

        {hasQueried
          ? (
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
            )
          : (
              'Please make a query! This may take a few seconds...'
            )}
      </Flex>
    </Box>
  )
}

export default App
