<!-- /frontend/src/routes/index.svelte -->
<script context="module">
	import { fetchThings } from "../js/processGraphql.js";
	import { 
		getMostLikedUidsQuery, 
		getRecentUidsQuery, 
		getOwnedUidsQuery, 
		getThingsForSaleUidsQuery 
	} from "../js/graphqlQueries.js";
	
	export async function preload() {
		let data = await Promise.all([
			fetchThings(getRecentUidsQuery()),
			fetchThings(getThingsForSaleUidsQuery()),
			this.fetch(`./getArtistEvent.json?event=artist`).then(res => res.json())
			// fetchData(getMostLikedUidsQuery()),
			// fetchData(getOwnedUidsQuery()),
		]);

		let eventInfo = data[2];

		try{
			console.log("WE DOIN IT")
			let endDate = new Date(eventInfo.endDate)
			let shouldShowEvent = new Date() <= endDate.setDate(endDate.getDate() + 3) && new Date() >= new Date(eventInfo.announceDate)
			if (!shouldShowEvent) eventInfo = false
		}catch (e) {
			eventInfo = null
		}

		return {
			// mostLiked: data[0],
			recent: data[0],
			forsale: data[1],
			eventInfo
		}
	}
</script>

<script>
	import {onMount} from 'svelte'

	// Components
	import Title from "../components/Title.svelte";
	// import PixelWall from '../components/PixelWall.svelte';
	import Recent from '../components/Recent.svelte';
	import ForSale from '../components/ForSale.svelte';
	import ArtistEvent from "../components/ArtistEvent.svelte";


	// export let mostLiked;
	export let segment;
	export let recent;
	export let forsale;
	export let eventInfo;

</script>

<style>
	*{
		text-align: center;
	}
	.release-date{
		margin: 2rem 0 0;
		font-size: 3rem;
    	font-weight: 200;
		color: var(--primary-dark);
    	text-shadow: 2px 2px #c3c3c3;
	}
	.hide-mobile{
		margin: 3rem auto;
	}
	@media (min-width: 450px) {
		.mobile-message{
			display: none;
		}
		.release-date{
			margin: 2rem 0 -4rem;
		}
	}
</style>

<svelte:head>
	<title>Pixel Snek: On-chain NFT Animations!</title>
</svelte:head>

<div class="hide-mobile">
	<Title fontSize={8} showFullLogo={true}/>
</div>

<div class="mobile-message">
	<strong>This site is not mobile optimized.</strong>
	Please visit us on a desktop for the full experience including integration with the Xian Wallet to enable
	<strong>buying, selling and creating custom NFT pixel animations!</strong>
</div>

{#if eventInfo}
	<ArtistEvent {eventInfo}/>
{/if}
<!-- {:else}
	<PixelWall {mostLiked}/>
{/if} -->

<Recent {recent} preview={true}/>
<ForSale {forsale} preview={true}/>