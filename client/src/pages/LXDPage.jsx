import SquidTopicPage from "./SquidTopicPage.jsx";
import TopicSiblings from "../components/TopicSiblings.jsx";
import { LXD } from "../data/lxd.js";

export default function LXDPage() {
  return (
    <SquidTopicPage
      topic={LXD}
      backTo="/"
      backLabel="Back to home"
      siblings={<TopicSiblings current={LXD.slug} sub="More Linux server topics." />}
    />
  );
}