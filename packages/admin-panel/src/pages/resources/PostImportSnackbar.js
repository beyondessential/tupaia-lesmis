import React, { useState, useEffect } from 'react';
import { TupaiaSnackbar, Button } from '@tupaia/ui-components';
import PropTypes from 'prop-types';

export const PostImportSnackbar = (recentImport, ...props) => {
  const { id } = recentImport;
  // const [currentId, setCurrentId] = useState(id);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (id !== undefined) {
      setOpen(false);
    }
  }, [setOpen, id]);

  const onClick = () => {
    setOpen(false);
  };

  const action = (
    <Button color="secondary" size="small" onClick={onClick}>
      Edit Visualisation
    </Button>
  );

  const message = 'This is really just a test, you can go now';

  return <TupaiaSnackbar message={message} action={action} open={open} {...props} />;
};

PostImportSnackbar.propTypes = {
  recentImport: PropTypes.object,
};

PostImportSnackbar.defaultProps = {
  recentImport: null,
};
