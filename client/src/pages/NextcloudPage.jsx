import SquidTopicPage from "./SquidTopicPage.jsx";
import TopicSiblings from "../components/TopicSiblings.jsx";
import { NEXTCLOUD } from "../data/nextcloud.js";

export default function NextcloudPage() {
  return (
    <SquidTopicPage
      topic={NEXTCLOUD}
      backTo="/"
      backLabel="Back to home"
      siblings={<TopicSiblings current={NEXTCLOUD.slug} sub="More Linux server topics." />}
    />
  );
}