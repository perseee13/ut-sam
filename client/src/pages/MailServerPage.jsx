import SquidTopicPage from "./SquidTopicPage.jsx";
import TopicSiblings from "../components/TopicSiblings.jsx";
import { MAIL_SERVER } from "../data/mail-server.js";

export default function MailServerPage() {
  return (
    <SquidTopicPage
      topic={MAIL_SERVER}
      backTo="/file-server"
      backLabel="Back to File Server"
      siblings={<TopicSiblings current={MAIL_SERVER.slug} sub="More topics to try next." />}
    />
  );
}
