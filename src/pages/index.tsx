import { GetStaticProps, NextPage } from "next";
import { getLatestVideos } from "../data";

interface Props {
  videos: Array<{ videoId: string; publishedAt: string }>;
}

const Index: NextPage<Props> = ({ videos }) => {
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

export const getStaticProps: GetStaticProps<Props> = async () => {
  const videos = await getLatestVideos();
  return {
    props: {
      videos: videos.map((e) => ({
        videoId: e.videoId.S,
        publishedAt: e.videoPublishedAt.S,
      })),
    },
    revalidate: 600,
  };
};

export default Index;
