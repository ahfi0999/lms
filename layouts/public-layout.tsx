import { Paper, createStyles, rem } from '@mantine/core';
import Image from 'next/image';
import account from '../lib/data/account';
import { useMediaQuery } from '@mantine/hooks';

const useStyles = createStyles((theme) => ({
  wrapper: {
    height: '100vh',
    backgroundSize: 'cover',
    backgroundImage: `url(${account.landingPageImage})`,
  },

  form: {
    borderRight: `${rem(1)} solid ${
      theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.colors.gray[3]
    }`,
    height: '100vh',
    maxWidth: rem(450),

    [theme.fn.smallerThan('sm')]: {
      maxWidth: '100%',
    },
    borderRadius: 0,
    padding: 30,
    display: 'flex',
    flexDirection: 'column',
  },

  logo: {
    objectFit: 'scale-down',
    margin: '0 auto 25% auto',
  },
}));

type PublicLayoutProps = {
  children: React.ReactNode;
};

function PublicLayout(props: PublicLayoutProps) {
  const { classes } = useStyles();
  const isSmallScreen = useMediaQuery('(max-width: 700px)');

  return (
    <div className={classes.wrapper}>
      <Paper className={classes.form}>
        <Image
          src={account.logo}
          height={isSmallScreen ? 100 : 200}
          width={isSmallScreen ? 200 : 400}
          alt={account.name}
          className={classes.logo}
        />
        {props.children}
      </Paper>
    </div>
  );
}

export default PublicLayout;
