import frozen from './v14-industrials-history-minimums.json' with {type:'json'}
/** One shared frozen count authority for scoring and canonical evidence planning.
 * Counts do not replace period type, composite component or source qualification. */
export function industrialsMinimumObservations(profileCode:string,signalCode:string):number|null {
 const profiles:Readonly<Record<string,Readonly<Record<string,number>>>>=frozen.profiles
 const profile=profiles[profileCode]
 if(!profile)return null
 const common:Readonly<Record<string,number>>=frozen.common
 return profile[signalCode]??common[signalCode]??null
}
export const INDUSTRIALS_FROZEN_SUPPORTING_HISTORY=frozen.supportingHistory
