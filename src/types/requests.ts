import type { BonusDTO } from '@/types'

export interface ChoiceRequest {
  data: string[]
  transitionID?: number
}

export interface MoveRequest {
  data: string[]
  transitionID?: number
}

export interface BattleRequest {
  weapon?: string
}

export interface EmptyRequest {
}

export interface BonusRequest extends BonusDTO {}

export type GameRequestData = ChoiceRequest | MoveRequest | BattleRequest | BonusRequest | EmptyRequest
