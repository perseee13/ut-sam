import SquidTopicPage from "./SquidTopicPage.jsx";
import TopicSiblings from "../components/TopicSiblings.jsx";
import { FILE_SERVER } from "../data/file-server.js";

export default function FileServerPage() {
  return (
    <SquidTopicPage
      topic={FILE_SERVER}
      backTo="/squid-proxy"
      backLabel="Back to Squid Proxy"
      siblings={<TopicSiblings current={FILE_SERVER.slug} sub="More topics to try next." />}
    />
  );
}
