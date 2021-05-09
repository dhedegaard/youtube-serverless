import { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import styled from "styled-components";
import { getLatestVideos } from "../data";

const Container = styled.div`
  max-width: 1140px;
  margin: 0 auto;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`;

const Elem = styled.div`
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  justify-content: space-between;
  align-items: stretch;
  width: calc(25% - 8px);
  margin-bottom: 16px;

  @media (max-width: 1024px) {
    width: calc(100% / 3 - 8px);
  }

  @media (max-width: 768px) {
    width: calc(50% - 8px);
  }
`;

const TitleAndPublishedAt = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
`;

const ThumbnailContainer = styled.a`
  position: relative;
  margin-bottom: 0;
  padding: 0;
  overflow: hidden;
  width: 100%;
  padding-top: calc(56.25% - 1px);
  display: flex;
  border-radius: 4px;
  margin-bottom: 4px;
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

const Title = styled.b`
  display: block;
  max-height: 6ex;
  overflow-y: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
`;

const ChannelTitle = styled.div`
  word-wrap: break-word;
  flex: 1 1 auto;
  max-height: 5.8ex;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const PublishedAt = styled.div`
  text-align: right;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow-x: hidden;
  flex: 0 1 auto;
`;

interface Props {
  videos: Array<{
    videoId: string;
    publishedAt: string;
    thumbnail: string;
    title: string;
    channelTitle: string;
    channelLink: string;
    channelThumbnail: string;
  }>;
}

const Index: NextPage<Props> = ({ videos }) => (
  <Container>
    {videos.map((e) => {
      const publishedAt = new Date(e.publishedAt);
      return (
        <Elem key={e.videoId}>
          <div>
            <ThumbnailContainer
              href={`https://www.youtube.com/watch?v=${e.videoId}`}
              target="_blank"
              rel="noreferrer noopener"
            >
              <Thumbnail src={e.thumbnail} alt={e.title} />
            </ThumbnailContainer>
            <Title>{e.title}</Title>
          </div>

          <TitleAndPublishedAt>
            <ChannelTitle>{e.channelTitle}</ChannelTitle>
            <PublishedAt>{publishedAt.toLocaleString()}</PublishedAt>
          </TitleAndPublishedAt>
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
        channelLink: e.channelLink.S,
        channelThumbnail: e.channelThumbnail.S,
      })),
    },
    revalidate: 600,
  };
};

export default Index;
