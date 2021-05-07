import { NextPage } from "next";
import { getLatestVideos } from "../data";

interface Props {
  videos: Array<{ videoId: string; publishedAt: string }>;
}

const Index: NextPage<Props> = ({ videos }) => {
  console.log("videos:", videos);
  return (
    <div>
      {videos.map((e) => (
        <p key={e.videoId}>
          {e.videoId} - {e.publishedAt}
        </p>
      ))}
    </div>
  );
};

Index.getInitialProps = async () => {
  const videos = await getLatestVideos();
  return {
    videos: videos.map((e) => ({
      videoId: e.videoId.S,
      publishedAt: e.videoPublishedAt.S,
    })),
  };
};

export default Index;
