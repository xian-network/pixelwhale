<script>
    import { getContext } from 'svelte'
	import { goto } from '@sapper/app';

    //MISC
	import { frames, frameSpeed, showModal, frameStore, activeFrame } from '../js/stores.js'
	import { serializeFrames, nameTaken, buildExplorerLink } from '../js/utils.js'
	import { createSnack, closeModel } from '../js/store-utils.js'
	import { config, stampLimits } from '../js/config.js';

    // Components
	import Preview from './Preview.svelte'

    const { sendTransaction } = getContext('app_functions')

	let name = "";
	let desc = "";
	let royaltyPercent = 5;
	let formElm;

	const created = $showModal.modalData.created

    const upload = () => {
    	const thing_string = serializeFrames($frames)

		const transaction = {
			methodName: 'create_thing',
			// networkType: config.networkType,
			kwargs: {
				thing_string,
				description: desc,
				name: name,
				meta: {
					speed: parseInt($frameSpeed),
					num_of_frames: $frames.length,
					royalty_percent: royaltyPercent
				}
			},
			stampLimit: 130 + (stampLimits[config.masterContract].per_frame_stamps * $frames.length)
		}
		sendTransaction(transaction, handleCreateTx)
		closeModel()
    }

	const checkName = async (e) => {
		if (await nameTaken(name)) e.target.setCustomValidity("Name already taken")
		else {
			e.target.setCustomValidity("")
		}
		e.target.reportValidity()
	}

	const handleCreateTx = (txResults) => {
        if (txResults.status === 0) {
			console.log({ txResults })
        	created()
			createSnack({
				title: `Created!`,
				body: `${name} is now on the blockchain.`,
				type: "info",
				link: buildExplorerLink(txResults.cometbft_hash)
			})

			const oldIndex = $activeFrame
			let newIndex = oldIndex  - 1
            if (newIndex < 0 ) newIndex = 0
            activeFrame.set(newIndex)

            frameStore.update(currentValue => {
                currentValue.splice(oldIndex, 1)
                return currentValue
            })
			let stateChange = txResults.state.find(f => f.key.includes(':names:'))
			if (stateChange && stateChange.value) redirect(stateChange.value, window.location.href)
		} else {
			createSnack({
				title: `Error!`,
				body: `Failed to create ${name}.`,
				type: "error",
				link: buildExplorerLink(txResults.cometbft_hash)
			})
		}
    }

    const redirect = (uid, location) =>  {
    	let maxChecks = 30
		let checks = 0
    	const checkForThing = async () => {
    		if (window.location.href !== location) return
    		checks = checks + 1
    		let res = await fetch(`./frames/${uid}.json`).then(res => res.json())
			if (res.thingInfo === null) {
				if (checks < maxChecks)setTimeout(checkForThing, 1000)
			}else {
				if (window.location.href === location) goto(`/frames/${uid}`)
			}
		}
		checkForThing()
	}
</script>

<style>
	.preview-row{
		text-align: center;
	}
	.outlined{
		color: var(--color-white-primary-tint);

	}
	.button:disabled {
		/* background: var(--primary-dark);
		color: var(--gray-2); */
		opacity: 0.5 !important;
	}
	textarea{
		resize: none;
	}

	label{
		font-weight: 600;
	}

	input[type="text"], textarea{
		margin-bottom: 1.5rem;
	}

    strong{
        font-size: 2em;
        font-weight: bold;
        color: var(--primary-dark);
		margin: 0 0 0.5rem;
    	align-self: center;
    }
	input[type="range"]::-webkit-slider-runnable-track {
		height: 10px;
		background: var(--color-white-primary-tint);
	}

	input[type="range"]::-webkit-slider-thumb {
	  height: 22px;
	  width: 22px;
	  border-radius: 99px;
	  background: var(--primary-dark);
	  cursor: pointer;
	  -webkit-appearance: none;
	  margin-top: -7px;
	}

</style>

<div class="modal-form flex-row">
	<div class="preview-row">
		<Preview frames={$frames} pixelSize={15} showWatermark={false}/>
		<input type="submit" class="button" value="Mint NFT!" form="create" disabled={name === "" ||  desc === ""} />
	</div>
	<form id="create" class="flex-col" on:submit|preventDefault={upload} bind:this={formElm}>
		<label for="name">Name your Artwork</label>
		<input id="name" type="text" placeholder="Name" required on:blur={checkName} bind:value={name}/>
		<label for="desc">Describe your creation</label>
		<textarea id="desc" type="textarea" rows="8" maxlength="128" placeholder="(max 128 chars)" required bind:value={desc}/>
		<label for="royalty">Collect royalties on each sale!</label>
		<strong>{royaltyPercent}%</strong>
		<input
			id="royalty"
			bind:value={royaltyPercent}
			type="range"
			min="0"
			max="100"
			class="slider">
	</form>
</div>
