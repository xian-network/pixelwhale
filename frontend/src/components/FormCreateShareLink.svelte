<script>
    import { getContext } from 'svelte'

	// Pictures
	import InfoIcon from '../../static/img/info-filled.svg'

	// Misc
	import { showModal } from '../js/stores.js'
	import { createSnack, closeModel } from '../js/store-utils.js'
	import { config } from '../js/config.js';

    const { sendTransaction } = getContext('app_functions')

	const updateInfo = $showModal.modalData.updateInfo
	const uid = $showModal.modalData.thingInfo['uid']
    const thingName = $showModal.modalData.thingInfo['name']

	let challenge;


    const proveOwnership = async () => {
		let authCodeInfo = await fetch(`./get-code.json?uid=${$showModal.modalData.thingInfo.uid}`).then(res => res.json())
		if (!authCodeInfo || !authCodeInfo.code) {
			createSnack({
				title: `Error`,
				body: `Unable to get Auth Code from server.`,
				type: "error"
			})
			return
		}

		challenge = authCodeInfo.challenge

		const transaction = {
			methodName: 'prove_ownership',
			networkType: config.networkType,
			kwargs: {
				uid,
				code: authCodeInfo.code
			}
		}
		sendTransaction(transaction, handleAuthCode)
		closeModel()
    }

	const handleAuthCode = async () => {
    	// console.log(txResults)
		// if (txResults.txBlockResult.status === 0) {
		// 	let authResponse = await checkForValidAuth()
		// 	if (authResponse.error){
		// 		createSnack({
		// 			title: `Cannot create share link!`,
		// 			body: ` ${authResponse.error}`,
		// 			type: "error"
		// 		})
		// 	}else{
		// 		updateInfo(authResponse)
		// 		createSnack({
		// 			title: `Share Link Created!`,
		// 			body: `You have created a shareable link for ${thingName}.`,
		// 			type: "info"
		// 		})
		// 	}
		// }
		let authResponse = await checkForValidAuth()
		if (authResponse.error){
			createSnack({
				title: `Cannot create share link!`,
				body: ` ${authResponse.error}`,
				type: "error"
			})
		}else{
			updateInfo(authResponse)
			createSnack({
				title: `Share Link Created!`,
				body: `You have created a shareable link for ${thingName}.`,
				type: "info"
			})
		}
    }

    const checkForValidAuth = () => new Promise(resolver => {
    	const maxChecks = 15;
    	let checks = 0;
    	const check = async () => {
    		checks = checks + 1
    		let res = await fetch(`./get_share_link.json?uid=${uid}&challenge=${challenge}`).then(res => res.json())
			if (res.shareLink) return resolver(res)
			if (res.error === "Challenge not accepted.") return resolver(res)
			if (res.error === "Thing doesn't exists.") return resolver(res)
			if (res.error === "Auth Code not valid." && checks === maxChecks) return resolver(res)
			if (checks === maxChecks) return resolver({error: "Unknown Error."})
			else {
				setTimeout(check, 2000)
			}
		}
		check()
	})
</script>

<style>
	.outlined{
		color: var(--color-white-primary-tint);
	}
	.outlined:disabled {
		background: var(--primary-dark);
		color: var(--gray-2);
	}
	input{
		max-width: 200px;
		margin: 0 auto;
	}
	hr{
		width: 100%;
		border: 2px solid white;
  		border-radius: 5px;
	}
	.icon{
		min-width: 150px;
		max-width: 200px;
		margin: 0 auto auto;
	}
	.info{
		margin-left: 1rem;
	}
	.info > p {
		margin-bottom: 0;
		max-width: 400px;
		color: var(--color-white-primary-tint);
	}
</style>

<div class="flex-col text-color-white-primary-tint">
	<div class="flex-row">
		<div class="icon">
			<InfoIcon width="20"/>
		</div>
		<div class="flex-col flex-justify-center info weight-600">
			<p>As the owner of this NFT you can create a shareable link that has no watermark.</p>
			<p>Creating a new link always invalidates previous links so be sure to save the link after creation.</p>
			<p>Share links are always invalidated after the NFT is sold.</p>
		</div>

	</div>

	<hr>
	<p class="text-center text-color-primary-dark">
		Click below to send A PROOF transaction to validate your ownership.
	</p>
	<form id="create_share_link" class="flex-col" on:submit|preventDefault={proveOwnership}>
		<input type="submit" class="button_text outlined" value="Prove Ownership" form="create_share_link" />
	</form>
</div>
