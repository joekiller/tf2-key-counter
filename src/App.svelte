<script lang="ts" xmlns="http://www.w3.org/1999/html">
	const KEY = /Mann Co\. Supply Crate Key/g;
	const REF = /Refined Metal/g;
	const REC = /Reclaimed Metal/g;
	const SCRAP = /Scrap Metal/g;
	let src = 'example.PNG';
	let value = '';
	const matches = (v: string, m: RegExp) => {
		const result = v.match(m);
		return result ? result.length : 0;
	}
	const calcRef = (scrap = 0, reclaimed = 0): number => {
		const sr = scrap === 0 ? 0 : Math.trunc(scrap / 9) + (scrap % 9 * 0.11);
		const rr = reclaimed === 0 ? 0 : Math.trunc(reclaimed / 3) + (reclaimed % 3 * 0.33);
		return rr + sr;
	}
	$: key = matches(value, KEY);
	$: ref = matches(value, REF) + calcRef(matches(value, SCRAP), matches(value, REC));
</script>

<main>
	<h1>TF2 Key and Refined Counter</h1>
	<p>{key} Key{key === 1 ? '' : 's'}, {ref} Refined</p>
	<textarea bind:value placeholder="Mann Co. Supply Crate Key"></textarea>
	<img src={src} alt="Steam Inventory History Screenshot with an Unusual and TF2 Key and Metal Text">
	<p>Paste the text of a trade from <a href="https://steamcommunity.com/id/joekiller/inventoryhistory/">steam inventory history</a> above to count the total Mann Co. Supply Crate Key and Refined Metal items from Team Fortress 2 were included in the trade.</p>
</main>
<footer>
	<h2>Helpful Links</h2>
	<div class="links">
		<a href="https://manic.tf/keyprice/">TF2 Key Price History</a>
		<a href="https://calculator.tf/">TF2 Currency Converter</a>
		<a href="https://github.com/joekiller/tf2-key-counter">site src and licenses</a>
		<a href="all/render/index.html">TF2 Spell Counts</a>
		<a href="allpostlife/render/index.html">TF2 Post Life Spell Counts</a>
	</div>
</footer>

<style>
	main {
		justify-content: center;
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	@media (min-width: 400px) {
		main {
			max-width: none;
		}
	}

	textarea { width: 80%; height: 200px; }
</style>
