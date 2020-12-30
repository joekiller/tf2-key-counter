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
	<h1>TF2 Key Counter</h1>
	<p>{key} Key{key === 1 ? '' : 's'}, {ref} Refined</p>
	<textarea bind:value placeholder="Mann Co. Supply Crate Key"></textarea>
	<img src={src} alt="+ Unusual Bazaar Bauble\n\n- Refined Metal, Refined Metal, Mann Co. Supply Crate Key, Mann Co. Supply Crate Key\nMann Co. Supply Crate Key, Mann Co. Supply Crate Key, Mann Co. Supply Crate Key,\nMann Co. Supply Crate Key, Refined Metal, Refined Metal, Refined Metal">
	<p>Paste your trade history text above to count total Mann Co. Supply Crate Key and Refined Metal items from Team Fortress 2.</p>
</main>

<style>
	main {
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

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}

	textarea { width: 100%; height: 200px; }
</style>
