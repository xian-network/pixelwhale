import { get } from "svelte/store";
import { config } from "./config.js";
import Xian from "xian-js";
import { snackbars, currency, userAccount, approvalAmount, showModal } from "./stores.js";
import { getCurrentKeyValue, toBigNumber } from "./utils.js";
import { executeGraphQlQuery } from "./processGraphql.js";
import { isLikedQuery } from "./graphqlQueries.js";

const masternode_api = new Xian.MasternodeAPI({ masternode_hosts: [config.masternode] });

const getAlreadyLiked = async (uid, account) => {
    const liked_query_string = isLikedQuery(uid, account)
    const res = await executeGraphQlQuery(liked_query_string)
    return res.data.allStates.nodes.value ? true : false
}

export const alreadyLiked = async (uid) => {
    let account = get(userAccount)
    //console.log({account, uid})
    if (account === '' || typeof window === 'undefined') return false;

    let lsValue = localStorage.getItem(`${uid}:${account}:liked`)
    //console.log({account, lsValue})
    //console.log({lsValue})
    if (lsValue !== null) return true;
    try {
        const liked = await getAlreadyLiked(uid, account)
        if (liked === true) localStorage.setItem(`${uid}:${account}:liked`, true)
        return liked
    } catch (error) {
        console.error("Error checking like status:", error);
        return false;
    }
}

export const checkForApproval = async (contract) => {
    if (!get(userAccount)) return
    let approval = await getCurrentKeyValue( "currency", "balances", `${get(userAccount)}:${contract}`)
    if (approval === null || typeof approval === 'undefined') approval = toBigNumber(0)
    if (!Xian.Encoder.BigNumber.isBigNumber(approval)) toBigNumber(approval)
    if (isNaN(approval)) toBigNumber(0)

    approvalAmount.update(curr => {
        curr[contract] = approval
        return curr
    })

    return approval
}

export const checkForAuctionApproval = async (uid) => {
    if (!get(userAccount)) return

    let contractName = config.masterContract
    let variableName = "balances"
    let key = `${get(userAccount)}:${uid}:${config.auctionContract}`

    let hasApproval =  await getCurrentKeyValue(contractName, variableName, key)
    if (hasApproval === null || typeof hasApproval === 'undefined') hasApproval = false
    return hasApproval
}

export const closeModel = () => {
    const modal = get(showModal)
    if (modal.show) showModal.set({modalData:{}, show: false})
}

export const createSnack = (snackInfo) => {
    const { type, title, body, delay, thingInfo, link } = snackInfo;
    snackbars.update(curr => {
        let snack = { type, time: new Date().getTime(), title, body, delay: delay || 5000, thingInfo, link }
        return [...curr, snack]
    })
}

export const needsApproval = async () => {
    let approval = await checkForApproval(config.masterContract)
}

export const processTxResults = (results) => {
    if (results.data) {
        if (results.data.errors) return results.data.errors
        if (results.data.resultInfo) {
            createSnack({
                title: results.data.resultInfo.title,
                body: results.data.resultInfo.subtitle,
                type: results.data.resultInfo.type
            })
            refreshTAUBalance()
        }
    }
    return []
}

export const refreshTAUBalance = async () => {
    if (!get(userAccount)) return

    const result = await masternode_api.getVariable("currency", `balances:${get(userAccount)}`);
    currency.set(result)
}