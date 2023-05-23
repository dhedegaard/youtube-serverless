/* eslint-disable @next/next/no-img-element */
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { NextPage } from "next";
import Image from "next/image";
import { use } from "react";
import favicon from "../../public/favicon.png";
import { getChannels, getLatestVideos } from "../data/dynamodb";
import styles from "./page.module.css";

dayjs.extend(relativeTime);

// Revalidate every 10 minutes.
export const revalidate = 600;

interface ChannelElem {
  key: string;
  link: string;
  thumbnail: string;
  title: string;
}

const Index: NextPage = () => {
  const [{ videos }, channels] = use(
    Promise.all([
      getVideos(),
      getChannels().then((channels) =>
        channels
          .map<ChannelElem>((channel) => ({
            key: channel.channelId.S,
            link: channel.channelLink.S,
            thumbnail: channel.channelThumbnail.S,
            title: channel.channelTitle.S,
          }))
          .reduce<ChannelElem[]>((acc, cur) => {
            if (!acc.some((e) => e.key === cur.key)) {
              acc.push(cur);
            }
            return acc;
          }, [])
          .sort((a, b) => a.title.localeCompare(b.title))
      ),
    ])
  );

  return (
    <>
      <nav className="w-full py-4 mb-2 bg-gray-700 text-white flex gap-4 items-end">
        <div className="max-w-[1140px] mx-auto flex flex-wrap gap-3 w-full px-2">
          <Image priority src={favicon} width={24} height={24} alt="Logo" />
          New youtube videos
          <div
            className={`${styles.channels} relative transition hover:bg-gray-800 rounded px-2 text-sm self-end mb-0.5`}
            tabIndex={0}
          >
            Channels
            <div
              className={`${styles.channelDropdown} absolute top-full left-0 bg-white text-black z-10 rounded shadow-2xl border-slate-800 box-border border-solid flex-col gap-1 py-1`}
            >
              {channels.map((channel) => (
                <a
                  key={channel.key}
                  target="_blank"
                  rel="noopener noreferrer"
                  href={channel.link}
                  className="text-sm text-slate-700 no-underline transition hover:text-slate-800 hover:underline max-h-[100vh] overflow-y-auto flex gap-2 items-center bg-white hover:bg-slate-200 focus:bg-slate-200 active:bg-slate-200 whitespace-nowrap py-1 px-4"
                >
                  <Image
                    src={channel.thumbnail}
                    alt=""
                    width={20}
                    height={20}
                    className="object-cover"
                  />
                  <div>{channel.title}</div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </nav>
      <div className="max-w-[1140px] mx-auto flex flex-wrap gap-[10px] px-2">
        {videos.map((e) => {
          const publishedAt = new Date(e.publishedAt);
          return (
            <div
              className="flex grow-0 shrink-0 basis-auto flex-col items-stretch mb-4 w-[calc(20%-8px)] max-lg:w-[calc(25%-8px)] max-md:w-[calc(100%/3-8px)] max-sm:w-[calc(50%-8px)]"
              key={e.videoId}
            >
              <a
                className="relative p-0 overflow-hidden w-full pt-[calc(56.25%-1px)] flex rounded mb-1 bg-blend-multiply bg-gray-50"
                href={`https://www.youtube.com/watch?v=${e.videoId}`}
                target="_blank"
                rel="noreferrer noopener"
              >
                <img
                  className={styles.thumbnail}
                  src={e.thumbnail}
                  alt={e.title}
                />
              </a>

              <b className={styles.title} title={e.title}>
                {e.title}
              </b>

              <div className="w-full flex justify-between items-center mt-auto">
                <a
                  className={styles.channelTitle}
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
                </a>

                <div
                  className="text-right whitespace-nowrap basis-auto text-gray-500 text-[0.75em]"
                  title={publishedAt.toLocaleString("en-US")}
                >
                  {dayjs(publishedAt).fromNow(true)} ago
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

const getVideos = async () => {
  const videos = await getLatestVideos();
  return {
    videos: videos.map((e) => ({
      videoId: e.videoId.S,
      publishedAt: e.videoPublishedAt.S,
      thumbnail: e.thumbnail.S,
      title: e.title.S,
      channelTitle: e.channelTitle.S,
      channelLink: e.channelLink.S,
      channelThumbnail: e.channelThumbnail.S,
    })),
  };
};

export default Index;
