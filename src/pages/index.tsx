import { GetStaticProps, NextPage } from "next";
import { getLatestVideos } from "../data";

interface Props {
  videos: Array<{
    videoId: string;
    publishedAt: string;
    thumbnail: string;
    title: string;
    channelTitle: string;
  }>;
}

const Index: NextPage<Props> = ({ videos }) => {
  return (
    <div>
      {videos.map((e) => (
        <a
          key={e.videoId}
          href={`https://www.youtube.com/watch?v=${e.videoId}`}
          target="_blank"
          rel="noreferrer noopener"
        >
          <img src={e.thumbnail} />
          <span>{e.title}</span>
          {e.videoId} - {e.publishedAt}
        </a>
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
        thumbnail: e.thumbnail.S,
        title: e.title.S,
        channelTitle: e.channelTitle.S,
      })),
    },
    revalidate: 600,
  };
};

export default Index;
