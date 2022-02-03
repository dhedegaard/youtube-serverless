import { GetStaticProps, NextPage } from "next";
import styled from "@emotion/styled";
import { getLatestVideos } from "../data";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Image from "next/image";
import favicon from "../../public/favicon.png";

dayjs.extend(relativeTime);

const Container = styled.div`
  max-width: 1140px;
  margin: 0 auto;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding-left: 8px;
  padding-right: 8px;
`;

const Navbar = styled.nav`
  width: 100%;
  padding: 16px 0;
  margin-bottom: 8px;
  background-color: #333;
  color: #fff;
`;

const Elem = styled.div`
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
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

const ChannelTitleAndPublishedAt = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
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
  background-blend-mode: multiply;
  background-color: #efefef;
`;

const Thumbnail = styled.img`
  padding: 0;
  margin: 0;
  position: absolute;
  top: 50%;
  left: 50%;
  margin-top: -37.5%;
  margin-left: -50%;
  bottom: 0;
  right: 0;
  border: 0;
  width: 100%;
  color: #efefef;
`;

const Title = styled.b`
  display: block;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
  font-size: 0.8em;
`;

const ChannelLogoContainer = styled.div`
  width: 16px;
  height: 16px;
  box-sizing: border-box;
  flex: 0 0 auto;
`;

const ChannelTitle = styled.a`
  word-wrap: break-word;
  flex: 1 1 auto;
  max-height: 5.8ex;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.85em;
  display: flex;
  gap: 4px;
  align-items: center;
  white-space: nowrap;
  padding-right: 8px;
  text-decoration: none;
  color: #000;
  position: relative;

  &::after {
    top: 0;
    bottom: 0;
    right: 0;
    width: 12px;
    content: "";
    position: absolute;
    background: linear-gradient(to left, #fff, transparent);
  }
`;

const PublishedAt = styled.div`
  text-align: right;
  white-space: nowrap;
  flex: 0 1 auto;
  color: #777;
  font-size: 0.75em;
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

const Index: NextPage<Props> = ({ videos }) => {
  return (
    <>
      <Navbar>
        <Container>
          <Image src={favicon} width={24} height={24} alt="Logo" />
          New youtube videos
        </Container>
      </Navbar>
      <Container>
        {videos.map((e) => {
          const publishedAt = new Date(e.publishedAt);
          return (
            <Elem key={e.videoId}>
              <ThumbnailContainer
                href={`https://www.youtube.com/watch?v=${e.videoId}`}
                target="_blank"
                rel="noreferrer noopener"
              >
                <Thumbnail src={e.thumbnail} alt={e.title} />
              </ThumbnailContainer>

              <Title title={e.title}>{e.title}</Title>

              <ChannelTitleAndPublishedAt>
                <ChannelTitle
                  href={e.channelLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ChannelLogoContainer>
                    <Image
                      src={e.channelThumbnail}
                      width={16}
                      height={16}
                      alt={e.channelTitle}
                    />
                  </ChannelLogoContainer>
                  <span>{e.channelTitle}</span>
                </ChannelTitle>

                <PublishedAt title={publishedAt.toLocaleString()}>
                  {dayjs(publishedAt).fromNow(true)} ago
                </PublishedAt>
              </ChannelTitleAndPublishedAt>
            </Elem>
          );
        })}
      </Container>
    </>
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
