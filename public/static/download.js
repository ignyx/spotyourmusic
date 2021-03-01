async function downloadPlaylist() {
  data = await fetch(`/playlist/${id}/json`)
    .then(response => response.json())

  if (!data.success) return alert('Failed to process download request')
  let interval = document.getElementById('timeBetweenTracks').value * 1000

  for (i = 0; i < data.tracks.length; i++) {
    track = data.tracks[i]
    if (track.available) {
      saveAs(`/tracks/${track.job}.mp3`, `${track.artist}-${track.title}.mp3`);
      await new Promise(resolve => setTimeout(() => resolve(), interval));
    } else {
      console.log(`Skipping unavailable track ${track.artist}-${track.title}`)
    }
  }
}
