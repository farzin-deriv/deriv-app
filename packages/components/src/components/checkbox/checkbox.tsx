import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, { MouseEventHandler, HTMLProps } from 'react';
import Icon from '../icon';
import Text from '../text';

type ICheckBoxProps = Omit<HTMLProps<HTMLInputElement>, 'value'> & {
    className: string;
    classNameLabel: string;
    defaultChecked: boolean;
    disabled: boolean;
    greyDisabled: boolean;
    id: string;
    label: string; //or object
    onChange: MouseEventHandler;
    value: boolean;
    withTabIndex: string;
};

const Checkbox = React.forwardRef(
    (
        {
            className,
            classNameLabel,
            disabled,
            id,
            label,
            defaultChecked,
            onChange, // This needs to be here so it's not included in `otherProps`
            value,
            withTabIndex,
            greyDisabled = false,
            ...otherProps
        }: ICheckBoxProps,
        ref: React.Ref<HTMLInputElement>
    ) => {
        const [checked, setChecked] = React.useState<boolean | undefined>(defaultChecked || value);
        const input_ref = React.useRef<HTMLInputElement>();

        const setRef = (el_input: HTMLInputElement) => {
            input_ref.current = el_input;
            if (ref) ref.current = el_input;
        };

        React.useEffect(() => {
            setChecked(defaultChecked || value);
        }, [value, defaultChecked]);

        const onInputChange = (e: any) => {
            e.persist();
            setChecked(!checked);
            onChange(e);
        };

        const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement> & { keyCode: number }): void => {
            // Enter or space
            if (!disabled && (e.key === 'Enter' || e.keyCode === 32)) {
                onChange({ target: { name: input_ref.current.name, checked: !checked } });
                setChecked(!checked);
            }
        };

        return (
            <label
                htmlFor={id}
                onClick={e => e.stopPropagation()}
                className={classNames('dc-checkbox', className, {
                    'dc-checkbox--disabled': disabled,
                })}
            >
                <input
                    className='dc-checkbox__input'
                    type='checkbox'
                    id={id}
                    ref={setRef}
                    disabled={disabled}
                    onChange={onInputChange}
                    defaultChecked={checked}
                    checked={value}
                    {...otherProps}
                />
                <span
                    className={classNames('dc-checkbox__box', {
                        'dc-checkbox__box--active': checked,
                        'dc-checkbox__box--disabled': disabled,
                        'dc-checkbox--grey-disabled': disabled && greyDisabled,
                    })}
                    {...(withTabIndex?.length > 0 ? { tabIndex: withTabIndex } : {})}
                    tabIndex='0'
                    onKeyDown={handleKeyDown}
                >
                    {!!checked && <Icon icon='IcCheckmark' color='active' />}
                </span>
                <Text size='xs' line_height='unset' className={classNames('dc-checkbox__label', classNameLabel)}>
                    {label}
                </Text>
            </label>
        );
    }
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;
