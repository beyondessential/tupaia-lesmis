/**
 * Tupaia
 * Copyright (c) 2017 - 2022 Beyond Essential Systems Pty Ltd
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import MuiIconButton from '@material-ui/core/IconButton';
import PlayIcon from '@material-ui/icons/PlayCircleFilled';
import { makeSubstitutionsInString } from '../utilities';
import { useApi } from '../utilities/ApiProvider';
import { DataTablePreviewControls } from './DataTablePreviewControls';

const dataTablePreviewEndpoint = 'dataTables/{code}/preview';

const PlayIconButton = styled(MuiIconButton)`
  border: 1px solid ${({ theme }) => theme.palette.grey['400']};
  border-radius: 3px;
  padding: 7px;
  color: ${props => props.theme.palette.primary.main};
  align-self: center;

  .MuiSvgIcon-root {
    width: 1em;
    height: 1em;
  }
`;

const ControlPanelContainer = styled.div`
  display: flex;
  height: 100%;
`;

export const DataTablePreviewControlPanel = ({
  setShowData,
  setIsLoading,
  setIsError,
  setError,
  setPreviewData,
  dataTable,
  dataTableParameters,
}) => {
  const [controlValues, setControlValues] = useState({});

  const api = useApi();

  const fetchDataTablePreviewData = async () => {
    try {
      setIsLoading(true);
      const previewEndpoint = makeSubstitutionsInString(dataTablePreviewEndpoint, dataTable);
      const previewResponse = await api.post(previewEndpoint, null, controlValues);
      setPreviewData(previewResponse.body.data);
      setIsError(false);
      setError(null);
    } catch (previewError) {
      setIsError(true);
      setError(previewError);
    } finally {
      setIsLoading(false);
    }
  };

  const onClickPlay = () => {
    fetchDataTablePreviewData();
    setShowData(true);
  };

  return (
    <ControlPanelContainer>
      <DataTablePreviewControls
        dataTableParameters={dataTableParameters}
        controlValues={controlValues}
        setControlValues={setControlValues}
      />
      <PlayIconButton onClick={onClickPlay}>
        <PlayIcon />
      </PlayIconButton>
    </ControlPanelContainer>
  );
};

DataTablePreviewControlPanel.propTypes = {
  setShowData: PropTypes.func.isRequired,
  setIsLoading: PropTypes.func.isRequired,
  setIsError: PropTypes.func.isRequired,
  setError: PropTypes.func.isRequired,
  setPreviewData: PropTypes.func.isRequired,
  dataTable: PropTypes.object.isRequired,
  dataTableParameters: PropTypes.array.isRequired,
};
