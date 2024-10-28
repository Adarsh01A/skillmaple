import React, { useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import './index.css';

const VideoSearch = () => {
  const [videoId, setVideoId] = useState(null);
  const [videoDetails, setVideoDetails] = useState({});
  const [videos, setVideos] = useState([]); // State to hold video results
  const [player, setPlayer] = useState(null);

  useEffect(() => {
    loadYouTubeIframeAPI();
    loadTrendingCourses();
  }, []);

  const loadYouTubeIframeAPI = () => {
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    window.onYouTubeIframeAPIReady = () => {
      console.log('YouTube IFrame API loaded');
    };
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  };

  const searchVideos = () => {
    const query = document.getElementById('search-query').value;
    const apiKey = 'AIzaSyDN938C9g9J_AA_Wb1qCbs78xt39Ih-UVE'; // Replace with your YouTube API key
    const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&maxResults=10&type=video&videoDuration=long&key=${apiKey}`;

    fetch(apiUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        if (!data.items || !Array.isArray(data.items)) {
          console.error('No items found in the response:', data);
          return; // Exit early if no items are found
        }

        const videoIds = data.items.map(item => item.id.videoId).join(',');

        fetch(`https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds}&key=${apiKey}`)
          .then(response => {
            if (!response.ok) {
              throw new Error('Network response was not ok');
            }
            return response.json();
          })
          .then(detailsData => {
            const newVideos = detailsData.items.map((item, index) => {
              const videoId = data.items[index]?.id.videoId; // Added optional chaining
              const videoTitle = data.items[index]?.snippet.title; // Added optional chaining
              const channelId = data.items[index]?.snippet.channelId; // Added optional chaining
              const channelTitle = data.items[index]?.snippet.channelTitle; // Added optional chaining
              const thumbnailUrl = data.items[index]?.snippet.thumbnails.medium.url; // Added optional chaining
              const duration = item.contentDetails.duration;

              const estimatedTime = convertDuration(duration);

              return { videoId, videoTitle, channelId, channelTitle, thumbnailUrl, estimatedTime };
            });
            setVideos(newVideos); // Update state with fetched video data
          })
          .catch(error => {
            console.error('Error fetching video details:', error);
          });
      })
      .catch(error => {
        console.error('Error fetching video search results:', error);
      });
  };

  const convertDuration = (duration) => {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    const hours = (parseInt(match[1]) || 0);
    const minutes = (parseInt(match[2]) || 0);
    return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
  };

  const selectVideo = (videoId, channelId, channelTitle, videoTitle, thumbnailUrl) => {
    setVideoId(videoId);
    setVideoDetails({
      channelId,
      channelTitle,
      title: videoTitle,
      thumbnailUrl,
    });

    const videoPlayer = document.getElementById('video-player');
    videoPlayer.innerHTML = `
      <iframe id="youtube-player" width="560" height="315" src="https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=1" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
    `;

    const newPlayer = new window.YT.Player('youtube-player', {
      events: {
        'onStateChange': onPlayerStateChange
      }
    });

    setPlayer(newPlayer);
  };

  const onPlayerStateChange = (event) => {
    if (event.data === window.YT.PlayerState.PLAYING && player) {
      const duration = player.getDuration();
      const checkTime = duration * 0.9;

      const interval = setInterval(() => {
        const currentTime = player.getCurrentTime();
        console.log(`Current time: ${currentTime}, Check time: ${checkTime}`);
        if (currentTime >= checkTime) {
          clearInterval(interval);
          document.getElementById('earn-certificate-btn').style.display = 'block';
        }
      }, 1000);
    }

    if (event.data === window.YT.PlayerState.ENDED) {
      const videoTitle = videoDetails.title;
      const duration = player.getDuration();
      const channelTitle = videoDetails.channelTitle;
      const channelLogo = videoDetails.thumbnailUrl;
      promptForCertificate(videoTitle, duration, channelTitle, channelLogo);
    }
  };

  const promptForCertificate = (videoTitle, duration, channelTitle, channelLogo) => {
    const userName = prompt("Please enter your name for your certificate:");
    if (userName) {
      generateCertificate(userName, videoTitle, duration, channelTitle, channelLogo);
    }
  };

  const generateCertificate = (userName, videoTitle, duration, channelTitle, channelLogo) => {
    const certificate = document.getElementById('certificate');
    document.getElementById('certificate-name').innerText = `Awarded to: ${userName}`;
    document.getElementById('certificate-title').innerText = `For completing: ${videoTitle}`;
    document.getElementById('certificate-length').innerText = `Video Length: ${Math.floor(duration / 60)} minutes`;
    document.getElementById('certificate-channel').innerText = `Instructor: ${channelTitle}`;
    document.getElementById('certificate-channel-logo').src = channelLogo;
    certificate.style.display = 'block';
    document.getElementById('earn-certificate-btn').style.display = 'none';
    document.getElementById('download-certificate-btn').style.display = 'block';
  };

  const downloadCertificate = () => {
    html2canvas(document.getElementById('certificate')).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const doc = new jsPDF();
      doc.addImage(imgData, 'PNG', 10, 10, 190, 100);
      doc.save('certificate.pdf');
    });
  };

  const loadTrendingCourses = () => {
    const apiKey = 'AIzaSyDN938C9g9J_AA_Wb1qCbs78xt39Ih-UVE'; // Replace with your YouTube API key
    const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&order=viewCount&maxResults=10&type=video&key=${apiKey}`;

    fetch(apiUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        if (!data.items || !Array.isArray(data.items)) {
          console.error('No items found in the response:', data);
          return; // Exit early if no items are found
        }

        const newVideos = data.items.map(item => ({
          videoId: item.id.videoId,
          videoTitle: item.snippet.title,
          channelTitle: item.snippet.channelTitle,
          thumbnailUrl: item.snippet.thumbnails.medium.url,
          channelId: item.snippet.channelId,
        }));

        setVideos(newVideos); // Update state with fetched trending videos
      })
      .catch(error => {
        console.error('Error fetching trending videos:', error);
      });
  };

  return (
    <div>
      <h1>Video Search</h1>
      <input id="search-query" type="text" placeholder="Search for videos..." />
      <button onClick={searchVideos}>Search</button>

      <div id="video-player" style={{ marginTop: '20px' }}></div>

      <div id="video-results">
        <h3>Search Results</h3>
        {videos.map((video) => (
          <div key={video.videoId} className="video-item">
            <img src={video.thumbnailUrl} alt={video.videoTitle} />
            <h4>{video.videoTitle}</h4>
            <p>Channel: {video.channelTitle}</p>
            <p>Duration: {video.estimatedTime}</p>
            <button onClick={() => selectVideo(video.videoId, video.channelId, video.channelTitle, video.videoTitle, video.thumbnailUrl)}>Watch</button>
          </div>
        ))}
      </div>

      <div id="video-player-container" style={{ marginTop: '20px' }}></div> {/* Changed ID */}

      <button id="earn-certificate-btn" style={{ display: 'none' }} onClick={promptForCertificate}>Earn Certificate</button>
      <button id="download-certificate-btn" style={{ display: 'none' }} onClick={downloadCertificate}>Download Certificate</button>

      <div id="certificate" style={{ display: 'none' }}>
        <h2 id="certificate-title"></h2>
        <p id="certificate-name"></p>
        <p id="certificate-length"></p>
        <p id="certificate-channel"></p>
        <img id="certificate-channel-logo" alt="Channel Logo" />
      </div>
    </div>
  );
};

export default VideoSearch;
