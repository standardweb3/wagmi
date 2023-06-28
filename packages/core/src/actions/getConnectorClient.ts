import {
  type Account,
  type Chain,
  type Client,
  type Transport,
  createClient,
  custom,
} from 'viem'

import type { Config } from '../config.js'
import { ConnectorNotFoundError } from '../errors/config.js'
import type { Evaluate } from '../internal.js'

export type GetConnectorClientParameters<
  config extends Config = Config,
  chainId extends config['chains'][number]['id'] = config['chains'][number]['id'],
> = {
  chainId?: chainId | config['chains'][number]['id'] | undefined
}

export type GetConnectorClientReturnType<
  config extends Config = Config,
  chainId extends config['chains'][number]['id'] = config['chains'][number]['id'],
> = Evaluate<
  Client<
    Transport,
    Extract<
      config['chains'][number],
      { id: chainId }
    > extends infer chain extends Chain
      ? chain
      : Chain,
    Account
  >
>

/** https://wagmi.sh/core/actions/getConnectorClient */
export async function getConnectorClient<
  config extends Config,
  chainId extends config['chains'][number]['id'],
>(
  config: config,
  { chainId }: GetConnectorClientParameters<config, chainId> = {},
): Promise<GetConnectorClientReturnType<config, chainId>> {
  const connection = config.state.connections.get(config.state.current!)
  if (!connection) throw new ConnectorNotFoundError()

  const resolvedChainId = chainId ?? connection.chainId
  const connector = connection.connector
  if (connector.getClient)
    return connector.getClient({
      chainId: resolvedChainId,
    }) as unknown as GetConnectorClientReturnType<config, chainId>

  const account = connection.accounts[0]!
  const chain = config.chains.find((chain) => chain.id === resolvedChainId)
  const provider = await connection.connector.getProvider({
    chainId: resolvedChainId,
  })

  return createClient({
    account,
    chain,
    transport(opts) {
      return custom(provider as any)({ ...opts, retryCount: 0 })
    },
  }) as unknown as GetConnectorClientReturnType<config, chainId>
}