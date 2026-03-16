// Типы для HTTP запросов
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface RegisterResponse {
  status: boolean;
  message: string;
  error?: string;
}

// Типы для аутентификации
export interface AuthCredentials {
  name: string;
  password: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface AuthResponse {
  success: boolean;
  data?: AuthTokens;
  error?: string;
}

export interface AuthUser {
  isAuthenticated: boolean;
}

export interface Transition {
  Text?: string;
  TransitionID?: number;
  Visited: boolean;
  BattleStart?: boolean;
  Weapon?: string;
  SleepyTransition?: boolean;
  Bribe?: boolean;
}

export interface SectionChoiceItems {
  Name?: string;
  Description?: string;
}

export interface SectionChoice {
  Items: SectionChoiceItems[]
  MaxSelections?: number;
}

export interface PlayerInfoBonus {
  alias: string;
  name: string;
  option?: string;
}

export interface PlayerInfo {
  health: number;
  meds: number;
  gold: number;
  bonus: PlayerInfoBonus[];
}

export interface Section {
  text: string;
  section: number;
  type: string;
  roll_the_dices: boolean;
  transitions?: Transition[];
  choice?: SectionChoice;
  player?: PlayerInfo;
  map_available: boolean;
}

export interface ActionResponse {
  result: string;
  error?: string;
  content?: string;
  actions?: Transition[];
}

export interface Action {
  status: string;
  data: ActionResponse;
}

export interface BonusDTO {
  bonus: string,
  option?: string,
}


// Profile

export interface Weapon {
  Name: string;
  MinCubeHit: number;
  Damage: number;
  Count?: number;
}

export interface Debuff {
  Health: number;
  Alias: string;
  Name: string;
}

export interface Buff {
  Health: number;
  Alias: string;
  Name: string;
}

export interface Bag {
  Name: string;
  Description: string;
}

export interface BonusOption {
  alias: string;
  name: string;
}

export interface Bonus {
  alias: string;
  name: string;
  option?: BonusOption;
}

export interface Meds {
  Name: string;
  Count: number;
}

export interface Profile {
  health: number;
  max_health: number;
  weapons: Weapon[];
  meds: Meds;
  bag: Bag[];
  debuff: Debuff[];
  buff: Buff[];
  gold: number;
  bonus: Bonus[];
}

export interface MapSection {
  id: string
  number: number
  title: string
  is_visited: boolean
  is_current: boolean
}

export interface MapTransition {
  from_section: number
  to_section: number
  text: string
  is_available: boolean
}

export interface MapData {
  sections: MapSection[]
  transitions: MapTransition[]
}

export type { GameRequestData } from './requests'