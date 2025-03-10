import { Story } from '../app';
import { Item } from './list-item';

export type ListProps = {
  list: Array<Story>;
  onRemoveItem: (item: Story) => void;
};

export const List = ({ list, onRemoveItem }: ListProps) => {
  console.log('List renders...');

  return (
    <ul>
      {list.map(item => (
        <Item
          key={item.objectID}
          item={item}
          onRemoveItem={onRemoveItem}
        />
      ))}
    </ul>
  );
};
