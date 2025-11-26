import {
  makeBalanceData,
  makeDailyAccountBalanceChangeMap,
  makeDeltaData,
  removeDuplicateAccounts,
} from '../balance-utils';
import { Interval, makeBucketNames } from '../date-utils';
import { t } from '../i18n';
import { IBarChartOptions, ILineChartOptions } from 'chartist';
import { Moment } from 'moment';
import React from 'react';
import ReactDOM from 'react-dom';
import ChartistGraph from 'react-chartist';
import styled from 'styled-components';

const ChartHeader = styled.div`
  display: flex;
`;

const Legend = styled.div`
  margin-left: auto;
  flex-shrink: 1;
`;

const ChartTypeSelector = styled.div`
  flex-shrink: 1;
  flex-grow: 0;
`;

const Chart = styled.div`
  .ct-label {
    color: var(--text-muted);
  }
  .ct-point {
    stroke-width: 10px;
    cursor: pointer;
  }
`;

const Tooltip = styled.div`
  position: fixed;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 12px;
  pointer-events: none;
  z-index: 9999;
  white-space: pre-line;
  transform: translate(-50%, -100%);
`;

export const AccountVisualization: React.FC<{
  dailyAccountBalanceMap: Map<string, Map<string, number>>;
  allAccounts: string[];
  selectedAccounts: string[];
  startDate: Moment;
  endDate: Moment;
  interval: Interval;
}> = (props): JSX.Element => {
  // TODO: Set the default mode based on the type of account selected
  const [mode, setMode] = React.useState('balance');

  console.log(props.dailyAccountBalanceMap);

  const filteredAccounts = removeDuplicateAccounts(props.selectedAccounts);
  const dateBuckets = makeBucketNames(
    props.interval,
    props.startDate,
    props.endDate,
  );

  const visualization =
    mode === 'balance' ? (
      <BalanceVisualization
        dailyAccountBalanceMap={props.dailyAccountBalanceMap}
        allAccounts={props.allAccounts}
        accounts={filteredAccounts}
        dateBuckets={dateBuckets}
      />
    ) : (
      <DeltaVisualization
        dailyAccountBalanceMap={props.dailyAccountBalanceMap}
        allAccounts={props.allAccounts}
        accounts={filteredAccounts}
        dateBuckets={dateBuckets}
        startDate={props.startDate}
        interval={props.interval}
      />
    );

  return (
    <>
      <ChartHeader>
        <ChartTypeSelector>
          <select
            className="dropdown"
            value={mode}
            onChange={(e) => {
              setMode(e.target.value);
            }}
          >
            <option value="balance">{t('account-balance')}</option>
            <option value="pnl">{t('profit-and-loss')}</option>
          </select>
        </ChartTypeSelector>
        <Legend>
          <ul className="ct-legend">
            {filteredAccounts.map((account, i) => (
              <li key={account} className={`ct-series-${i}`}>
                {account}
              </li>
            ))}
          </ul>
        </Legend>
      </ChartHeader>
      <Chart>{visualization}</Chart>
    </>
  );
};

const BalanceVisualization: React.FC<{
  dailyAccountBalanceMap: Map<string, Map<string, number>>;
  allAccounts: string[];
  accounts: string[];
  dateBuckets: string[];
}> = (props): JSX.Element => {
  const [tooltip, setTooltip] = React.useState<{
    visible: boolean;
    x: number;
    y: number;
    content: string;
  } | null>(null);
  const chartRef = React.useRef<HTMLDivElement>(null);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    const container = chartRef.current;
    if (!container) return;

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('ct-point')) {
        if (timerRef.current) clearTimeout(timerRef.current);

        timerRef.current = setTimeout(() => {
          const metaStr = target.getAttribute('ct:meta');
          if (metaStr) {
            const rect = target.getBoundingClientRect();
            setTooltip({
              visible: true,
              x: rect.left + rect.width / 2,
              y: rect.top - 10,
              content: metaStr,
            });
          }
        }, 1000);
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('ct-point')) {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        setTooltip(null);
      }
    };

    container.addEventListener('mouseover', handleMouseOver);
    container.addEventListener('mouseout', handleMouseOut);

    return () => {
      container.removeEventListener('mouseover', handleMouseOver);
      container.removeEventListener('mouseout', handleMouseOut);
    };
  }, []);

  const data = {
    labels: props.dateBuckets,
    series: props.accounts.map((account) =>
      makeBalanceData(
        props.dailyAccountBalanceMap,
        props.dateBuckets,
        account,
        props.allAccounts,
      ),
    ),
  };

  const options: ILineChartOptions = {
    height: '300px',
    width: '100%',
    showArea: false,
    showPoint: true,
  };

  return (
    <div ref={chartRef}>
      <ChartistGraph data={data} options={options} type="Line" />
      {tooltip &&
        tooltip.visible &&
        ReactDOM.createPortal(
          <Tooltip style={{ left: tooltip.x, top: tooltip.y }}>
            {tooltip.content}
          </Tooltip>,
          document.body,
        )}
    </div>
  );
};

const DeltaVisualization: React.FC<{
  dailyAccountBalanceMap: Map<string, Map<string, number>>;
  allAccounts: string[];
  accounts: string[];
  dateBuckets: string[];
  startDate: Moment;
  interval: Interval;
}> = (props): JSX.Element => {
  const data = {
    labels: props.dateBuckets,
    series: props.accounts.map((account) =>
      makeDeltaData(
        props.dailyAccountBalanceMap,
        props.startDate
          .clone()
          .subtract(1, props.interval)
          .format('YYYY-MM-DD'),
        props.dateBuckets,
        account,
        props.allAccounts,
      ),
    ),
  };

  const options: IBarChartOptions = {
    height: '300px',
    width: '100%',
  };

  return <ChartistGraph data={data} options={options} type="Bar" />;
};
