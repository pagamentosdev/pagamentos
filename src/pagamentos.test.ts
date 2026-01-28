import { attest } from '@ark/attest'
import { it } from 'vitest'
import { Pagamentos } from './pagamentos'

it('creates a pagamentos instance', () => {
  const pg = new Pagamentos({
    providers: []
  })

  attest<Pagamentos>(pg)
})
