import { GetStaticProps, NextPage } from "next";
import styled from "styled-components";
import { getLatestVideos } from "../data";

const Container = styled.div`
  max-width: 1140px;
  margin: 0 auto;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`;

const Elem = styled.a`
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  width: calc(25% - 8px);
`;

const SpaceBetween = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
`;

const ThumbnailContainer = styled.div`
  position: relative;
  margin-bottom: 0;
  padding: 0;
  overflow: hidden;
  width: 100%;
  padding-top: calc(56.25% - 1px);
  display: flex;
  border-radius: 4px;
`;

const Thumbnail = styled.img`
  padding: 0;
  margin: 0;
  position: absolute;
  top: 50%;
  left: 50%;
  margin-top: -37%;
  margin-left: -50%;
  bottom: 0;
  right: 0;
  border: 0;
  width: 100%;
`;

interface Props {
  videos: Array<{
    videoId: string;
    publishedAt: string;
    thumbnail: string;
    title: string;
    channelTitle: string;
  }>;
}

const Index: NextPage<Props> = ({ videos }) => (
  <Container>
    {videos.map((e) => {
      const publishedAt = new Date(e.publishedAt);
      return (
        <Elem
          key={e.videoId}
          href={`https://www.youtube.com/watch?v=${e.videoId}`}
          target="_blank"
          rel="noreferrer noopener"
        >
          <ThumbnailContainer>
            <Thumbnail src={e.thumbnail} alt={e.title} />
          </ThumbnailContainer>
          <p>
            <b>{e.title}</b>
          </p>

          <SpaceBetween>
            <p>{e.channelTitle}</p>
            <p>{publishedAt.toLocaleString()}</p>
          </SpaceBetween>
        </Elem>
      );
    })}
  </Container>
);

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
