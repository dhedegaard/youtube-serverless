import styled from "@emotion/styled";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { GetStaticProps, NextPage } from "next";
import Image from "next/image";
import favicon from "../../public/favicon.png";
import { getLatestVideos } from "../data";

dayjs.extend(relativeTime);

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
      <nav className="w-full py-4 mb-2 bg-gray-700 text-white">
        <div className="max-w-[1140px] mx-auto flex flex-wrap gap-[10px] px-2">
          <Image priority src={favicon} width={24} height={24} alt="Logo" />
          New youtube videos
        </div>
      </nav>
      <div className="max-w-[1140px] mx-auto flex flex-wrap gap-[10px] px-2">
        {videos.map((e) => {
          const publishedAt = new Date(e.publishedAt);
          return (
            <Elem
              className="flex grow-0 shrink-0 basis-auto flex-col items-stretch mb-4 w-[calc(20%-8px)] max-sm:w-[calc(50%-8px)] max"
              key={e.videoId}
            >
              <a
                className="relative p-0 overflow-hidden w-full pt-[calc(56.25%-1px)] flex rounded mb-1 bg-blend-multiply bg-gray-50"
                href={`https://www.youtube.com/watch?v=${e.videoId}`}
                target="_blank"
                rel="noreferrer noopener"
              >
                <Thumbnail src={e.thumbnail} alt={e.title} />
              </a>

              <Title title={e.title}>{e.title}</Title>

              <div className="w-full flex justify-between items-center mt-auto">
                <ChannelTitle
                  href={e.channelLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="w-4 h-4 box-border shrink-0 grow-0 basis-auto">
                    <Image
                      src={e.channelThumbnail}
                      width={16}
                      height={16}
                      alt={e.channelTitle}
                    />
                  </div>
                  <span>{e.channelTitle}</span>
                </ChannelTitle>

                <div
                  className="text-right whitespace-nowrap basis-auto text-gray-500 text-[0.75em]"
                  title={publishedAt.toLocaleString("en-US")}
                >
                  {dayjs(publishedAt).fromNow(true)} ago
                </div>
              </div>
            </Elem>
          );
        })}
      </div>
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
