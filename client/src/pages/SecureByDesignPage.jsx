import SquidTopicPage from "./SquidTopicPage.jsx";
import TopicSiblings from "../components/TopicSiblings.jsx";
import { SECURE_BY_DESIGN } from "../data/secure-by-design.js";

export default function SecureByDesignPage() {
  return (
    <SquidTopicPage
      topic={SECURE_BY_DESIGN}
      backTo="/"
      backLabel="Back to home"
      siblings={<TopicSiblings current={SECURE_BY_DESIGN.slug} sub="More Linux server topics." />}
    />
  );
}