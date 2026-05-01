import { List } from '@mantine/core';
import DownloadFile from './DownloadFile';

type DisplayFileLinksProps = {
  links: string[];
};

function DisplayFileLinks(props: DisplayFileLinksProps) {
  return (
    <List>
      {props.links.map((link, index) => (
        <List.Item key={index}>
          <DownloadFile azureFileUrl={link} />
        </List.Item>
      ))}
    </List>
  );
}

export default DisplayFileLinks;
