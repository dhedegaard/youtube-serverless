import { GetStaticProps, NextPage } from "next";
import styled from "styled-components";
import { getLatestVideos } from "../data";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

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
  margin-bottom: 16px;
  width: calc(20% - 8px);

  @media (max-width: 1140px) {
    width: calc(25% - 8px);
  }

  @media (max-width: 768px) {
    width: calc(100% / 3 - 8px);
  }

  @media (max-width: 475px) {
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

const ChannelLogo = styled.img`
  border-radius: 4px;
`;

const ChannelTitle = styled.a`
  word-wrap: break-word;
  flex: 1 1 auto;
  max-height: 5.8ex;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.9em;
  display: flex;
  gap: 4px;
  align-items: center;
  white-space: nowrap;
  margin-right: 8px;
  text-decoration: none;
  color: #000;
`;

const PublishedAt = styled.div`
  text-align: right;
  white-space: nowrap;
  flex: 0 1 auto;
  color: #777;
  font-size: 0.8em;
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

const formatRelativeTime = (date: Date) => {
  const formatter = new Intl.RelativeTimeFormat();
};

const Index: NextPage<Props> = ({ videos }) => {
  return (
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
              <ChannelTitle
                href={e.channelLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ChannelLogo
                  src={e.channelThumbnail}
                  width={16}
                  height={16}
                  alt={e.channelTitle}
                />
                {e.channelTitle}
              </ChannelTitle>

              <PublishedAt title={publishedAt.toLocaleString()}>
                {dayjs(publishedAt).fromNow(true)} ago
              </PublishedAt>
            </TitleAndPublishedAt>
          </Elem>
        );
      })}
    </Container>
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
        channelLink: e.channelLink.S,
        channelThumbnail: e.channelThumbnail.S,
      })),
    },
    revalidate: 600,
  };
};

export default Index;
