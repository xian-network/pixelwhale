<script>
	import { userAccount, currency, walletInfo, walletInstalled } from '../js/stores'
	import { beforeUpdate, onMount } from 'svelte'

	import { formatAccountAddress, stringToFixed } from '../js/utils.js'
	import {  checkForApproval, refreshTAUBalance} from '../js/store-utils.js'
	import { config } from '../js/config'

	import Title from './Title.svelte'
	import WalletConnectButton from './WalletConnectButton.svelte'

	export let segment;
	export let xdu;

	let initalize = false;
	let balance;
	let timer;
	setTimeout(() => initalize = true, 300)

	$: xduInitialized = false;

	onMount(() => {
		timer = setTimeout(() => {
		if ($userAccount && !balance) {
			balance = refreshTAUBalance()
			checkForApproval(config.masterContract)
			timer = null;
		}
		}, 1000)
	})


	beforeUpdate(() => {
		if (!xdu) {
			balance = undefined
			xduInitialized = false;
		}
		if (xdu && !xduInitialized) xduInitialized = true;
	})

</script>

<style>
	nav {
		position: relative;
    	top: 0;
		left: 0;
		min-height: fit-content;
		box-sizing: border-box;
    	width: 100%;
		padding: 1rem 3em;
		display: flex;
		flex-direction: row;
		align-items: center;
		background: white;
		border-bottom: 1px solid #ff5bb047;
		z-index: 1;
	}
	nav.flex-row{
		justify-content: center;
	}
	.desktop{
		display: none;
	}
	.brand{
		align-items: center;
		justify-content: center;
		font-weight: 300;
		font-size: 2em;
		min-width: max-content;
		cursor: pointer;
	}
	.brand > img {
		width: 37px;
		min-width: 37px;
		margin-right: 8px;
	}
	.account{
		color: #161454;
		height: 100%;
		align-items: flex-end;
		justify-content: space-evenly;
		font-weight: 200;
		font-size: 0.9em;
		line-height: 1.2;
		text-align: right;
		flex-grow: 1;
		min-width: 20%;
	}
	.currency > strong {
		margin-left: 4px;
	}

	/* .account >  p > strong.account-info{
		color: var(--primary);
		font-weight: 400;

	} */
	.address{
		width: 93%;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		align-self: flex-end;
		margin: 0.25rem 1rem 0 0 ;
		color: var(--primary);
	}
	.address:hover{
		color: var(--primary)
	}
	.currency{
		color: var(--primary-dark);
		font-size: 1em;
		margin: 0;
		background: #dedede8c;
		padding: 0.5rem 1rem;
		border-radius: 10px;
	}

	.links{
		display: none;
		padding: 0 20px;
		min-width: max-content;
		color: var(--primary-dark);
	}
	ul {
		margin: 0;
		padding: 0;
	}
	/* clearfix */
	ul::after {
		content: '';
		display: block;
		clear: both;
	}
	li {
		display: block;
		float: left;
	}
	[aria-current] {
		position: relative;
		display: inline-block;
	}
	[aria-current]::after {
		position: absolute;
		content: '';
		width: calc(100% - 1em);
		height: 2px;
		background-color: var(--primary);
		display: block;
		bottom: -1px;
	}
	li > a {
		text-decoration: none;
		padding: 1em 0.5em;
		display: block;
	}
	li > a:hover{
		color: var(--primary);
	}

	@media (min-width: 900px) {
		.links {
			display: block;
			font-size: 1.3em;
		}
		li > a {
			padding: 1em 0.25em 0.5em;
			margin-bottom: 0.5em;
		}
		[aria-current]::after {
			width: calc(100% - 0.5em);
			height: 3px;
		}
		.currency{
			font-size: 20px;
		}
		.account{
			font-size: 20px;
		}
	}
	@media (min-width: 450px) {
		.desktop {
			display: flex;
		}
		nav.flex-row{
			justify-content: unset;
		}
	}
	a.brand{
		text-decoration: none;
	}

</style>

<nav class="flex-row">
	<a class="brand flex-row" rel=prefetch  href=".">
		<img src="img/PIXELSNEK-124.png" alt="nav logo">
		<Title fontSize={1.2} subtitle={false}/>
	</a>
	<div class="links desktop">
		<ul>
			<li><a rel=prefetch aria-current="{segment === 'create' ? 'page' : undefined}" href="create">create</a></li>
			{#if $userAccount !== "" || $userAccount == undefined}
				<li><a rel=prefetch aria-current="{segment === 'owned' ? 'page' : undefined}" href={'owned/' + $userAccount}>owned</a></li>
			{/if}
			<li><a rel=prefetch aria-current="{segment === 'recent' ? 'page' : undefined}" href="recent">recent</a></li>
			<li><a rel=prefetch aria-current="{segment === 'forsale' ? 'page' : undefined}" href="forsale">for sale</a></li>
			<!-- <li><a href="https://docs.pixelwhale.io" target="_blank" rel="noopener noreferrer">docs</a></li> -->
		</ul>
	</div>
	<div class="flex-col account desktop hide-mobile">
		{#if $userAccount !== "" && initalize && !$walletInfo.locked}
			<p class="currency">
				{stringToFixed($currency, 8)}<strong>{config.currencySymbol}</strong>
			</p>
			<a href={`${config.blockExplorer}/addresses/${$userAccount}`}
			   target="_blank"
			   rel="noopener noreferrer"
			   class="address">
				{`${formatAccountAddress($userAccount, 8, 4)}`}
			</a>
		{:else if xduInitialized && initalize}
				<WalletConnectButton {xdu} />
		{:else if $walletInstalled === 'not_installed'}
			INSTALL WALLET PLS
		{/if}

	</div>
</nav>
